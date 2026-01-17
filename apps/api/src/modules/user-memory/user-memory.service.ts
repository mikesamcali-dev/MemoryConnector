import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OnboardingAnswersDto,
  UpdateProfileDto,
  UpdateReviewConfigDto,
  CheckInResponsesDto,
} from './dto';
import {
  UserMemoryProfile,
  AdaptiveReviewConfig,
  Memory,
  LearningStyle,
  SkillLevel,
  PreferredPace,
  PrimaryGoal,
  CheckInType,
} from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class UserMemoryService {
  private readonly logger = new Logger(UserMemoryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Initialize user memory profile from onboarding responses
   */
  async createProfileFromOnboarding(
    userId: string,
    answers: OnboardingAnswersDto,
  ): Promise<UserMemoryProfile> {
    this.logger.log(`Creating profile for user ${userId}`);

    // Calculate personalized defaults based on skill level
    const maxReviewsPerSession = this.getMaxReviewsForSkillLevel(
      answers.skillLevel,
    );
    const preferRecognition =
      answers.preferRecognition ??
      (answers.skillLevel === SkillLevel.BEGINNER);
    const showContext = answers.showContext ?? true;

    // Calculate difficulty threshold from tolerance (inverse scaling)
    const difficultyThreshold = answers.difficultyTolerance
      ? 1.0 - (answers.difficultyTolerance - 1) * 0.05 // 1→0.95, 3→0.85, 5→0.75
      : 0.8;

    // Calculate interval multiplier based on pace
    const intervalMultiplier = this.getIntervalMultiplierForPace(
      answers.preferredPace,
    );
    const maxInterval = this.getMaxIntervalForPace(answers.preferredPace);

    // Create profile and config in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create profile
      const profile = await tx.userMemoryProfile.create({
        data: {
          userId,
          learningStyle: answers.learningStyle,
          skillLevel: answers.skillLevel,
          primaryGoal: answers.primaryGoal,
          preferredPace: answers.preferredPace,
          dailyTimeCommitment: answers.dailyTimeCommitment,
          areasOfInterest: answers.areasOfInterest || [],
          cognitivePreferences: answers.cognitivePreferences || {},
          preferredReviewTime: answers.preferredReviewTime || null,
          peakActivityHours: [],
          onboardingCompleted: true,
        },
      });

      // Create adaptive review config
      await tx.adaptiveReviewConfig.create({
        data: {
          userId,
          maxReviewsPerSession,
          preferRecognition,
          showContext,
          enableHapticFeedback: answers.enableHapticFeedback ?? true,
          intervalMultiplier,
          maxInterval,
          difficultyThreshold,
        },
      });

      // Create default implementation intention if reminders enabled
      if (answers.enableReminders) {
        const triggerTime =
          answers.preferredReviewTime === 'morning'
            ? '08:00'
            : answers.preferredReviewTime === 'evening'
              ? '20:00'
              : answers.preferredReviewTime === 'afternoon'
                ? '14:00'
                : '08:00';

        await tx.implementationIntention.create({
          data: {
            userId,
            triggerType: 'TIME',
            triggerValue: triggerTime,
            action: 'Review today\'s memories',
            ifThenPhrase: `If it's ${triggerTime}, then I'll review today's memories`,
            enabled: true,
            frequency: 'DAILY',
            customDays: [],
          },
        });
      }

      return profile;
    });

    this.logger.log(`Profile created successfully for user ${userId}`);
    return result;
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserMemoryProfile | null> {
    return this.prisma.userMemoryProfile.findUnique({
      where: { userId },
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileDto,
  ): Promise<UserMemoryProfile> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.prisma.userMemoryProfile.update({
      where: { userId },
      data,
    });
  }

  /**
   * Get personalized review config
   */
  async getPersonalizedReviewConfig(
    userId: string,
  ): Promise<AdaptiveReviewConfig | null> {
    return this.prisma.adaptiveReviewConfig.findUnique({
      where: { userId },
    });
  }

  /**
   * Update review config
   */
  async updateReviewConfig(
    userId: string,
    data: UpdateReviewConfigDto,
  ): Promise<AdaptiveReviewConfig> {
    const config = await this.getPersonalizedReviewConfig(userId);
    if (!config) {
      throw new NotFoundException('Review config not found');
    }

    return this.prisma.adaptiveReviewConfig.update({
      where: { userId },
      data,
    });
  }

  /**
   * Get adaptive due reviews with personalized ordering
   */
  async getAdaptiveDueReviews(
    userId: string,
    limit?: number,
  ): Promise<Memory[]> {
    const profile = await this.getProfile(userId);
    const config = await this.getPersonalizedReviewConfig(userId);

    if (!profile || !config) {
      // Fallback to standard retrieval if profile not set up
      return this.getStandardDueReviews(userId, limit);
    }

    const actualLimit = limit ?? config.maxReviewsPerSession;

    // Get due reviews
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let memories = await this.prisma.memory.findMany({
      where: {
        userId,
        state: 'SAVED',
        OR: [
          // Never reviewed and created more than 1 day ago
          {
            nextReviewAt: null,
            reviewCount: 0,
            createdAt: { lte: oneDayAgo },
          },
          // Due for review
          {
            nextReviewAt: { lte: now },
          },
        ],
      },
      include: {
        location: true,
        person: true,
        wordLinks: {
          include: {
            word: true,
          },
        },
      },
      take: actualLimit * 2, // Fetch more than needed for sorting
    });

    // Apply learning style-based ordering
    const styleSorted = this.orderByLearningStyle(memories, profile.learningStyle);

    // Apply goal-based ordering
    const goalSorted = this.orderByPrimaryGoal(styleSorted, profile.primaryGoal);

    // Limit to requested amount
    return goalSorted.slice(0, actualLimit) as any;
  }

  /**
   * Standard due reviews (fallback)
   */
  private async getStandardDueReviews(
    userId: string,
    limit = 20,
  ): Promise<Memory[]> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return this.prisma.memory.findMany({
      where: {
        userId,
        state: 'SAVED',
        OR: [
          {
            nextReviewAt: null,
            reviewCount: 0,
            createdAt: { lte: oneDayAgo },
          },
          {
            nextReviewAt: { lte: now },
          },
        ],
      },
      include: {
        location: true,
        person: true,
        wordLinks: {
          include: {
            word: true,
          },
        },
      },
      orderBy: [{ nextReviewAt: 'asc' }, { createdAt: 'asc' }],
      take: limit,
    });
  }

  /**
   * Order memories by learning style
   */
  private orderByLearningStyle(
    memories: Memory[],
    learningStyle: LearningStyle,
  ): Memory[] {
    switch (learningStyle) {
      case LearningStyle.VISUAL:
        // Prioritize memories with images
        return memories.sort((a, b) => {
          const aHasImage = a.imageUrl ? 1 : 0;
          const bHasImage = b.imageUrl ? 1 : 0;
          return bHasImage - aHasImage;
        });

      case LearningStyle.HANDS_ON:
        // Prioritize memories with lower review count (more practice needed)
        return memories.sort((a, b) => a.reviewCount - b.reviewCount);

      case LearningStyle.THEORETICAL:
        // Prioritize complex memories (longer content)
        return memories.sort((a, b) => {
          const aLength = (a.title?.length || 0) + (a.body?.length || 0);
          const bLength = (b.title?.length || 0) + (b.body?.length || 0);
          return bLength - aLength;
        });

      default:
        // Default: sort by nextReviewAt
        return memories.sort((a, b) => {
          const aTime = a.nextReviewAt?.getTime() || 0;
          const bTime = b.nextReviewAt?.getTime() || 0;
          return aTime - bTime;
        });
    }
  }

  /**
   * Order memories by primary goal
   */
  private orderByPrimaryGoal(
    memories: Memory[],
    primaryGoal: PrimaryGoal,
  ): Memory[] {
    switch (primaryGoal) {
      case PrimaryGoal.RETENTION:
        // Strict SRS order (already done by nextReviewAt)
        return memories;

      case PrimaryGoal.LEARNING:
        // Prioritize newer memories
        return memories.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );

      case PrimaryGoal.ORGANIZATION:
        // No specific ordering - rely on learning style
        return memories;

      case PrimaryGoal.HABIT_BUILDING:
        // Randomize to maintain variety
        return memories.sort(() => Math.random() - 0.5);

      default:
        return memories;
    }
  }

  /**
   * Adapt review parameters based on recent performance (run daily via cron)
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async adaptReviewParameters(): Promise<void> {
    this.logger.log('Running daily adaptation for all users');

    const profiles = await this.prisma.userMemoryProfile.findMany({
      where: { onboardingCompleted: true },
      include: { user: true },
    });

    for (const profile of profiles) {
      try {
        await this.adaptProfileDaily(profile.userId);
      } catch (error) {
        this.logger.error(
          `Failed to adapt profile for user ${profile.userId}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Daily adaptation complete. Processed ${profiles.length} profiles`,
    );
  }

  /**
   * Adapt a single user's profile based on last 30 days performance
   */
  async adaptProfileDaily(userId: string): Promise<void> {
    // Get recent stats
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats || stats.totalReviewsCompleted < 10) {
      // Not enough data to adapt
      return;
    }

    // Calculate recall rate
    const successfulReviews =
      stats.totalReviewsGood + stats.totalReviewsEasy + stats.totalReviewsHard;
    const totalReviews = stats.totalReviewsCompleted;
    const averageRecallRate =
      totalReviews > 0 ? successfulReviews / totalReviews : 0;

    // Get current config
    const config = await this.getPersonalizedReviewConfig(userId);
    if (!config) return;

    let newMultiplier = config.intervalMultiplier;

    // Adjust interval multiplier based on performance
    if (averageRecallRate > 0.9 && totalReviews >= 20) {
      // Too easy - increase intervals
      newMultiplier = Math.min(2.0, newMultiplier + 0.1);
    } else if (
      averageRecallRate < config.difficultyThreshold &&
      totalReviews >= 10
    ) {
      // Too hard - decrease intervals
      newMultiplier = Math.max(0.5, newMultiplier - 0.1);
    }

    // Update profile and config
    await this.prisma.$transaction([
      this.prisma.userMemoryProfile.update({
        where: { userId },
        data: {
          averageRecallRate,
          optimalReviewInterval: newMultiplier,
          lastAdaptationUpdate: new Date(),
        },
      }),
      this.prisma.adaptiveReviewConfig.update({
        where: { userId },
        data: {
          intervalMultiplier: newMultiplier,
        },
      }),
    ]);

    this.logger.log(
      `Adapted profile for user ${userId}: recall rate ${(averageRecallRate * 100).toFixed(1)}%, multiplier ${newMultiplier.toFixed(2)}`,
    );
  }

  /**
   * Check if profile refinement check-in is needed
   */
  async shouldTriggerCheckIn(userId: string): Promise<{
    needed: boolean;
    type?: CheckInType;
    reason?: string;
  }> {
    const profile = await this.getProfile(userId);
    if (!profile || !profile.onboardingCompleted) {
      return { needed: false };
    }

    const now = new Date();
    const lastCheckIn = profile.lastCheckInDate;

    // Weekly check-in: 7 days since last
    if (
      !lastCheckIn ||
      now.getTime() - lastCheckIn.getTime() > 7 * 24 * 60 * 60 * 1000
    ) {
      return {
        needed: true,
        type: CheckInType.WEEKLY,
        reason: 'scheduled_weekly',
      };
    }

    // Monthly check-in: 30 days since last
    if (now.getTime() - lastCheckIn.getTime() > 30 * 24 * 60 * 60 * 1000) {
      return {
        needed: true,
        type: CheckInType.MONTHLY,
        reason: 'scheduled_monthly',
      };
    }

    // Triggered check-in: low engagement (3+ consecutive missed days)
    if (profile.consecutiveMissedDays >= 3) {
      return {
        needed: true,
        type: CheckInType.TRIGGERED,
        reason: 'low_engagement',
      };
    }

    // Triggered check-in: low recall rate
    if (profile.averageRecallRate < 0.5 && profile.averageRecallRate > 0) {
      return {
        needed: true,
        type: CheckInType.TRIGGERED,
        reason: 'low_recall_rate',
      };
    }

    return { needed: false };
  }

  /**
   * Process profile refinement check-in responses
   */
  async processProfileCheckIn(
    userId: string,
    data: CheckInResponsesDto,
  ): Promise<UserMemoryProfile> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Snapshot before changes
    const beforeSnapshot = {
      learningStyle: profile.learningStyle,
      skillLevel: profile.skillLevel,
      primaryGoal: profile.primaryGoal,
      preferredPace: profile.preferredPace,
      dailyTimeCommitment: profile.dailyTimeCommitment,
    };

    // Process responses and determine updates
    const updates: Partial<UserMemoryProfile> = {};
    if (data.responses.wantsSlowerPace === true) {
      updates.preferredPace = PreferredPace.GRADUAL;
    }
    if (data.responses.wantsFasterPace === true) {
      updates.preferredPace = PreferredPace.INTENSIVE;
    }
    if (data.responses.needsMoreSupport === true) {
      updates.skillLevel = SkillLevel.BEGINNER;
    }

    // Update profile
    const updatedProfile = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.userMemoryProfile.update({
        where: { userId },
        data: {
          ...updates,
          lastCheckInDate: new Date(),
          totalCheckIns: { increment: 1 },
        },
      });

      // Record check-in
      await tx.profileCheckIn.create({
        data: {
          userId,
          checkInType: data.checkInType,
          triggerReason: data.triggerReason || null,
          questions: { responses: data.responses },
          profileUpdatesBefore: beforeSnapshot,
          profileUpdatesAfter: updates,
        },
      });

      return updated;
    });

    this.logger.log(`Profile check-in processed for user ${userId}`);
    return updatedProfile;
  }

  /**
   * Record review completion for daily check-in tracking
   */
  async recordReviewCompletion(
    userId: string,
    memoryId: string,
    rating: any,
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.dailyCheckIn.upsert({
      where: {
        userId_checkInDate: {
          userId,
          checkInDate: today,
        },
      },
      update: {
        reviewsCompleted: { increment: 1 },
      },
      create: {
        userId,
        checkInDate: today,
        reviewsDue: 0, // Will be set by separate query
        reviewsCompleted: 1,
        intentionsTriggered: 0,
        intentionsCompleted: 0,
      },
    });
  }

  /**
   * Record intention completion for daily check-in tracking
   */
  async recordIntentionCompletion(
    userId: string,
    intentionId: string,
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.dailyCheckIn.upsert({
      where: {
        userId_checkInDate: {
          userId,
          checkInDate: today,
        },
      },
      update: {
        intentionsCompleted: { increment: 1 },
      },
      create: {
        userId,
        checkInDate: today,
        reviewsDue: 0,
        reviewsCompleted: 0,
        intentionsTriggered: 0,
        intentionsCompleted: 1,
      },
    });
  }

  /**
   * Get analytics for user profile
   */
  async getProfileAnalytics(userId: string): Promise<any> {
    const profile = await this.getProfile(userId);
    const config = await this.getPersonalizedReviewConfig(userId);
    const checkIns = await this.prisma.dailyCheckIn.findMany({
      where: { userId },
      orderBy: { checkInDate: 'desc' },
      take: 30,
    });

    return {
      profile,
      config,
      recentCheckIns: checkIns,
      adaptationHistory: {
        currentMultiplier: config?.intervalMultiplier,
        currentRecallRate: profile?.averageRecallRate,
        lastUpdate: profile?.lastAdaptationUpdate,
      },
    };
  }

  // Helper methods
  private getMaxReviewsForSkillLevel(skillLevel: SkillLevel): number {
    switch (skillLevel) {
      case SkillLevel.BEGINNER:
        return 10;
      case SkillLevel.INTERMEDIATE:
        return 20;
      case SkillLevel.ADVANCED:
        return 30;
      default:
        return 20;
    }
  }

  private getIntervalMultiplierForPace(pace: PreferredPace): number {
    switch (pace) {
      case PreferredPace.INTENSIVE:
        return 0.8;
      case PreferredPace.MODERATE:
        return 1.0;
      case PreferredPace.GRADUAL:
        return 1.5;
      default:
        return 1.0;
    }
  }

  private getMaxIntervalForPace(pace: PreferredPace): number {
    switch (pace) {
      case PreferredPace.INTENSIVE:
        return 21;
      case PreferredPace.MODERATE:
        return 30;
      case PreferredPace.GRADUAL:
        return 60;
      default:
        return 30;
    }
  }
}
