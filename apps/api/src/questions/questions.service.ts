import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { logger } from '../common/logger';

@Injectable()
export class QuestionsService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Create a question and get answer from OpenAI
   */
  async create(userId: string, dto: CreateQuestionDto) {
    // Verify memory ownership
    const memory = await this.prisma.memory.findFirst({
      where: {
        id: dto.memoryId,
        userId,
      },
    });

    if (!memory) {
      throw new NotFoundException('Memory not found or you do not have permission to access it');
    }

    // Get answer from OpenAI
    let answer: string | null = null;
    try {
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: dto.question,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        answer = response.choices[0]?.message?.content || null;
        logger.info({ questionId: dto.memoryId, hasAnswer: !!answer }, 'OpenAI question answered');
      } else {
        logger.warn('OpenAI not configured, question saved without answer');
      }
    } catch (error) {
      logger.error({ error, question: dto.question }, 'Failed to get answer from OpenAI');
      // Continue anyway, save question without answer
    }

    // Save question with answer
    const question = await this.prisma.question.create({
      data: {
        userId,
        memoryId: dto.memoryId,
        question: dto.question,
        answer,
      },
    });

    return question;
  }

  /**
   * Get all questions for a user
   */
  async findAll(userId: string) {
    const questions = await this.prisma.question.findMany({
      where: { userId },
      include: {
        memory: {
          select: {
            id: true,
            title: true,
            body: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return questions;
  }

  /**
   * Get a specific question by ID
   */
  async findOne(id: string, userId: string) {
    const question = await this.prisma.question.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        memory: {
          select: {
            id: true,
            title: true,
            body: true,
            occurredAt: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  /**
   * Delete a question
   */
  async delete(id: string, userId: string) {
    const question = await this.prisma.question.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.prisma.question.delete({
      where: { id },
    });

    return { success: true, message: 'Question deleted successfully' };
  }
}
