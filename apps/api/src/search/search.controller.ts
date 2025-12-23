import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsageLimitGuard } from '../usage/guards/usage-limit.guard';
import { UsageResource } from '../usage/decorators/usage-resource.decorator';
import { User } from '../common/decorators/user.decorator';
import { SearchService } from './search.service';
import { UsageService } from '../usage/usage.service';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard, UsageLimitGuard)
@UsageResource('searches')
@ApiBearerAuth('JWT-auth')
export class SearchController {
  constructor(
    private searchService: SearchService,
    private usageService: UsageService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Search memories' })
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @User() user?: any
  ) {
    if (!query || typeof query !== 'string') {
      throw new BadRequestException({
        error: 'MISSING_QUERY',
        message: 'Query parameter q is required',
      });
    }

    const results = await this.searchService.searchMemories(
      user.id,
      query,
      limit ? Math.min(parseInt(limit), 100) : 20,
      offset ? parseInt(offset) : 0
    );

    // Increment usage
    await this.usageService.incrementUsage(user.id, 'searches');

    return results;
  }
}

