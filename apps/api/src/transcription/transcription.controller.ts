import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TranscriptionService } from './transcription.service';
import { LexiconService } from './lexicon.service';
import { SubmitFeedbackDto, LexiconTermDto } from './dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Transcription')
@Controller('transcription')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TranscriptionController {
  constructor(
    private transcriptionService: TranscriptionService,
    private lexiconService: LexiconService,
  ) {}

  /**
   * Batch transcription: Upload audio file, get transcript
   */
  @Post('batch')
  @UseInterceptors(FileInterceptor('audio'))
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Transcribe audio file (batch mode)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio: {
          type: 'string',
          format: 'binary',
          description: 'Audio file to transcribe (webm, mp4, wav)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Transcription completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid audio file or format' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async batchTranscribe(@Req() req, @UploadedFile() file: any) {
    const userId = req.user.id;

    const result = await this.transcriptionService.transcribeBatch(userId, file.buffer, file.mimetype);

    return result;
  }

  /**
   * Submit user corrections for learning
   */
  @Post('feedback')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({ summary: 'Submit transcript corrections for personalization' })
  @ApiResponse({ status: 200, description: 'Feedback submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid feedback data' })
  async submitFeedback(@Req() req, @Body() dto: SubmitFeedbackDto) {
    const userId = req.user.id;

    const result = await this.transcriptionService.submitFeedback(
      userId,
      dto.sessionId,
      dto.rawTranscript,
      dto.correctedText,
      dto.consentStore,
    );

    return result;
  }

  /**
   * Get user's lexicon terms
   */
  @Get('lexicon')
  @ApiOperation({ summary: 'Get user lexicon terms' })
  @ApiResponse({ status: 200, description: 'Lexicon retrieved successfully' })
  async getUserLexicon(@Req() req) {
    const userId = req.user.id;
    return this.lexiconService.getUserLexicon(userId);
  }

  /**
   * Add term to user lexicon
   */
  @Post('lexicon')
  @ApiOperation({ summary: 'Add term to user lexicon' })
  @ApiResponse({ status: 201, description: 'Term added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid term data' })
  async addLexiconTerm(@Req() req, @Body() dto: LexiconTermDto) {
    const userId = req.user.id;
    return this.lexiconService.addTerm(userId, dto.term, dto.replacement, dto.weight);
  }

  /**
   * Remove term from user lexicon
   */
  @Delete('lexicon/:term')
  @ApiOperation({ summary: 'Remove term from user lexicon' })
  @ApiResponse({ status: 200, description: 'Term removed successfully' })
  @ApiResponse({ status: 404, description: 'Term not found' })
  async removeLexiconTerm(@Req() req, @Param('term') term: string) {
    const userId = req.user.id;
    return this.lexiconService.removeTerm(userId, decodeURIComponent(term));
  }
}
