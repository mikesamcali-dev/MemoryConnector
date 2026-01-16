import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HelpViewsService } from './help-views.service';

@ApiTags('help-views')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('help-views')
export class HelpViewsController {
  constructor(private helpViewsService: HelpViewsService) {}

  @Get(':pageKey')
  @ApiOperation({ summary: 'Get help view state for a specific page' })
  @ApiResponse({ status: 200, description: 'Help view state returned' })
  async getHelpViewState(@Req() req, @Param('pageKey') pageKey: string) {
    return this.helpViewsService.getHelpViewState(req.user.sub, pageKey);
  }

  @Post(':pageKey/increment')
  @ApiOperation({ summary: 'Increment view count for a page' })
  @ApiResponse({ status: 200, description: 'View count incremented' })
  async incrementViewCount(@Req() req, @Param('pageKey') pageKey: string) {
    return this.helpViewsService.incrementViewCount(req.user.sub, pageKey);
  }

  @Delete('reset')
  @ApiOperation({ summary: 'Reset all help view counts to 0' })
  @ApiResponse({ status: 200, description: 'All help views reset' })
  async resetAllHelpViews(@Req() req) {
    return this.helpViewsService.resetAllHelpViews(req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all help view states for current user' })
  @ApiResponse({ status: 200, description: 'All help view states returned' })
  async getAllHelpViewStates(@Req() req) {
    return this.helpViewsService.getAllHelpViewStates(req.user.sub);
  }
}
