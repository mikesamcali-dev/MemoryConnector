import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HelpViewState {
  pageKey: string;
  viewCount: number;
  shouldShow: boolean;
  lastViewAt: Date | null;
}

@Injectable()
export class HelpViewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get help view state for a specific page
   * Returns view count and whether to show popup (viewCount < 3)
   */
  async getHelpViewState(
    userId: string,
    pageKey: string,
  ): Promise<HelpViewState> {
    const helpView = await this.prisma.userHelpView.findUnique({
      where: {
        userId_pageKey: { userId, pageKey },
      },
    });

    const viewCount = helpView?.viewCount ?? 0;
    const shouldShow = viewCount < 3;

    return {
      pageKey,
      viewCount,
      shouldShow,
      lastViewAt: helpView?.lastViewAt ?? null,
    };
  }

  /**
   * Increment view count for a page (upsert pattern)
   * Only increments if viewCount < 3 (no need to track beyond max)
   */
  async incrementViewCount(
    userId: string,
    pageKey: string,
  ): Promise<HelpViewState> {
    const current = await this.prisma.userHelpView.findUnique({
      where: { userId_pageKey: { userId, pageKey } },
    });

    // Don't increment beyond 3
    if (current && current.viewCount >= 3) {
      return this.getHelpViewState(userId, pageKey);
    }

    await this.prisma.userHelpView.upsert({
      where: { userId_pageKey: { userId, pageKey } },
      update: {
        viewCount: { increment: 1 },
        lastViewAt: new Date(),
      },
      create: {
        userId,
        pageKey,
        viewCount: 1,
        lastViewAt: new Date(),
      },
    });

    return this.getHelpViewState(userId, pageKey);
  }

  /**
   * Reset all help view counts for a user to 0
   * Used by "Reset my helpers" button in settings
   */
  async resetAllHelpViews(
    userId: string,
  ): Promise<{ success: boolean; resetAt: Date }> {
    await this.prisma.userHelpView.updateMany({
      where: { userId },
      data: {
        viewCount: 0,
        lastViewAt: new Date(),
      },
    });

    return { success: true, resetAt: new Date() };
  }

  /**
   * Get all help view states for a user (for debugging/admin)
   */
  async getAllHelpViewStates(userId: string): Promise<HelpViewState[]> {
    const helpViews = await this.prisma.userHelpView.findMany({
      where: { userId },
      orderBy: { pageKey: 'asc' },
    });

    return helpViews.map((hv) => ({
      pageKey: hv.pageKey,
      viewCount: hv.viewCount,
      shouldShow: hv.viewCount < 3,
      lastViewAt: hv.lastViewAt,
    }));
  }
}
