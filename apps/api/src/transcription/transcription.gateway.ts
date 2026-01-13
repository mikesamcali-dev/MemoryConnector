import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TranscriptionService } from './transcription.service';
import { WhisperService } from './whisper.service';
import { LexiconService } from './lexicon.service';
import { ClaudeCleanupService } from './claude-cleanup.service';
import { PrismaService } from '../prisma/prisma.service';

interface SessionData {
  sessionId: string;
  userId: string;
  chunks: Buffer[];
  mimeType: string;
  startTime: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/transcription',
})
export class TranscriptionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TranscriptionGateway.name);
  private sessions = new Map<string, SessionData>();

  constructor(
    private transcriptionService: TranscriptionService,
    private whisperService: WhisperService,
    private lexiconService: LexiconService,
    private claudeCleanup: ClaudeCleanupService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Authenticate on connection
      const token = client.handshake?.auth?.token || client.handshake?.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client['user'] = payload; // Attach user to socket
      this.logger.log(`Client connected: ${client.id} (user: ${payload.email})`);
    } catch (error) {
      this.logger.warn(`Client ${client.id} connection rejected: Invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Cleanup session if exists
    this.sessions.delete(client.id);
  }

  @SubscribeMessage('startSession')
  async handleStartSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionKey: string; mimeType: string },
  ) {
    const userId = client['user'].id;

    // Create session in database
    const session = await this.prisma.speechSession.create({
      data: {
        userId,
        sessionKey: data.sessionKey,
        status: 'active',
        audioFormat: data.mimeType,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Store in-memory session
    this.sessions.set(client.id, {
      sessionId: session.id,
      userId,
      chunks: [],
      mimeType: data.mimeType,
      startTime: Date.now(),
    });

    client.emit('sessionStarted', { sessionId: session.id });
  }

  @SubscribeMessage('audioChunk')
  async handleAudioChunk(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionKey: string; audioB64: string; chunkIndex: number },
  ) {
    const sessionData = this.sessions.get(client.id);
    if (!sessionData) {
      client.emit('error', { message: 'No active session' });
      return;
    }

    try {
      // Decode base64 audio chunk
      const audioBuffer = Buffer.from(data.audioB64, 'base64');
      sessionData.chunks.push(audioBuffer);

      // Save chunk metadata (no audio stored)
      await this.prisma.speechChunk.create({
        data: {
          sessionId: sessionData.sessionId,
          chunkIndex: data.chunkIndex,
          sizeBytes: audioBuffer.length,
        },
      });

      // Update chunk count
      await this.prisma.speechSession.update({
        where: { id: sessionData.sessionId },
        data: { chunkCount: { increment: 1 } },
      });

      // Every 3 chunks (~2-3 seconds), transcribe recent window for partial updates
      if (sessionData.chunks.length % 3 === 0 && sessionData.chunks.length > 0) {
        const recentChunks = sessionData.chunks.slice(-3);
        const combinedBuffer = Buffer.concat(recentChunks);

        // Get bias terms
        const biasTerms = await this.lexiconService.getBiasTerms(sessionData.userId);

        // Transcribe
        const { text: partialText } = await this.whisperService.transcribeAudio(
          combinedBuffer,
          sessionData.mimeType,
          sessionData.userId,
          biasTerms,
        );

        // Apply lexicon
        const lexiconText = await this.lexiconService.applyLexicon(
          sessionData.userId,
          partialText,
        );

        // Update partial transcript in DB
        await this.prisma.speechSession.update({
          where: { id: sessionData.sessionId },
          data: { partialTranscript: lexiconText },
        });

        // Send partial transcript to client
        client.emit('partialTranscript', { text: lexiconText });
      }
    } catch (error) {
      this.logger.error(`Error processing chunk: ${error.message}`, error.stack);
      client.emit('error', { message: 'Failed to process audio chunk' });
    }
  }

  @SubscribeMessage('stopSession')
  async handleStopSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionKey: string },
  ) {
    const sessionData = this.sessions.get(client.id);
    if (!sessionData) {
      client.emit('error', { message: 'No active session' });
      return;
    }

    try {
      // Mark session as processing
      await this.prisma.speechSession.update({
        where: { id: sessionData.sessionId },
        data: {
          status: 'processing',
          processingStartedAt: new Date(),
        },
      });

      // Combine all chunks for final transcription
      const fullAudioBuffer = Buffer.concat(sessionData.chunks);

      // Get bias terms
      const biasTerms = await this.lexiconService.getBiasTerms(sessionData.userId);

      // Final transcription with full audio
      const { text: rawText, duration } = await this.whisperService.transcribeAudio(
        fullAudioBuffer,
        sessionData.mimeType,
        sessionData.userId,
        biasTerms,
      );

      // Apply lexicon
      const lexiconText = await this.lexiconService.applyLexicon(sessionData.userId, rawText);

      // Cleanup with Claude
      const finalText = await this.claudeCleanup.cleanupTranscript(lexiconText, biasTerms);

      // Update session with final transcript
      await this.prisma.speechSession.update({
        where: { id: sessionData.sessionId },
        data: {
          status: 'completed',
          finalTranscript: finalText,
          durationMs: duration * 1000,
          processingEndedAt: new Date(),
        },
      });

      // Send final transcript to client
      client.emit('finalTranscript', {
        sessionId: sessionData.sessionId,
        rawTranscript: rawText,
        finalTranscript: finalText,
        durationSeconds: duration,
      });

      // Cleanup in-memory session (audio chunks deleted)
      this.sessions.delete(client.id);
    } catch (error) {
      this.logger.error(`Error stopping session: ${error.message}`, error.stack);

      await this.prisma.speechSession.update({
        where: { id: sessionData.sessionId },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });

      client.emit('error', { message: 'Failed to finalize transcription' });
    }
  }
}
