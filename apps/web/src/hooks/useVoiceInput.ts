import { useState, useCallback, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

interface VoiceInputResult {
  state: RecordingState;
  transcript: string;
  partialTranscript: string;
  error: string | null;
  sessionId: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
}

export function useVoiceInput(accessToken: string): VoiceInputResult {
  const [state, setState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const sessionKeyRef = useRef<string>(crypto.randomUUID());

  // Initialize WebSocket connection
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const socket = io(`${apiUrl}/transcription`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('sessionStarted', ({ sessionId: id }: { sessionId: string }) => {
      setSessionId(id);
    });

    socket.on('partialTranscript', ({ text }: { text: string }) => {
      setPartialTranscript(text);
    });

    socket.on(
      'finalTranscript',
      ({
        finalTranscript: final,
        sessionId: id,
      }: {
        finalTranscript: string;
        sessionId: string;
      }) => {
        setTranscript(final);
        setSessionId(id);
        setState('idle');
      },
    );

    socket.on('error', ({ message }: { message: string }) => {
      setError(message);
      setState('error');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  const startRecording = useCallback(async () => {
    try {
      // Reset state
      setTranscript('');
      setPartialTranscript('');
      setError(null);
      sessionKeyRef.current = crypto.randomUUID();

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';

      // Create recorder
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      // Start session on server
      socketRef.current?.emit('startSession', {
        sessionKey: sessionKeyRef.current,
        mimeType,
      });

      let chunkIndex = 0;

      // Handle data chunks
      recorder.ondataavailable = async (event) => {
        if (!event.data || event.data.size === 0) return;

        // Convert to base64
        const arrayBuffer = await event.data.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        // Send chunk to server
        socketRef.current?.emit('audioChunk', {
          sessionKey: sessionKeyRef.current,
          audioB64: base64,
          chunkIndex: chunkIndex++,
        });
      };

      // Start recording with 750ms chunks
      recorder.start(750);
      setState('recording');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setState('error');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;

    setState('processing');
    recorderRef.current.stop();

    // Stop all audio tracks
    recorderRef.current.stream.getTracks().forEach((track) => track.stop());

    // Notify server
    socketRef.current?.emit('stopSession', {
      sessionKey: sessionKeyRef.current,
    });

    recorderRef.current = null;
  }, []);

  return {
    state,
    transcript,
    partialTranscript,
    error,
    sessionId,
    startRecording,
    stopRecording,
  };
}
