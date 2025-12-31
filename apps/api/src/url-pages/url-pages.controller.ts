import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UrlPagesService } from './url-pages.service';
import { AddUrlDto } from './dto/add-url.dto';

@ApiTags('url-pages')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('url-pages')
export class UrlPagesController {
  constructor(private readonly urlPagesService: UrlPagesService) {}

  @Post('add')
  @ApiOperation({ summary: 'Add a URL and analyze its content' })
  @ApiResponse({ status: 201, description: 'URL analyzed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid URL or fetch failed' })
  async addUrl(@Request() req, @Body() addUrlDto: AddUrlDto) {
    const userId = req.user.id;
    return this.urlPagesService.addUrl(userId, addUrlDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all URL pages for the current user' })
  @ApiResponse({ status: 200, description: 'URL pages retrieved successfully' })
  async getUserUrlPages(
    @Request() req,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const userId = req.user.id;
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 20;
    return this.urlPagesService.getUserUrlPages(userId, skipNum, takeNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific URL page by ID' })
  @ApiResponse({ status: 200, description: 'URL page retrieved successfully' })
  @ApiResponse({ status: 404, description: 'URL page not found' })
  async getUrlPageById(@Request() req, @Param('id') urlPageId: string) {
    const userId = req.user.id;
    return this.urlPagesService.getUrlPageById(userId, urlPageId);
  }

  @Post('link')
  @ApiOperation({ summary: 'Link a URL page to a memory' })
  @ApiResponse({ status: 201, description: 'URL page linked successfully' })
  @ApiResponse({ status: 404, description: 'URL page or memory not found' })
  async linkUrlPageToMemory(
    @Request() req,
    @Body() body: { urlPageId: string; memoryId: string },
  ) {
    const userId = req.user.id;
    return this.urlPagesService.linkUrlPageToMemory(userId, body.urlPageId, body.memoryId);
  }

  @Post('link-multiple')
  @ApiOperation({ summary: 'Link multiple URL pages to a memory' })
  @ApiResponse({ status: 201, description: 'URL pages linked successfully' })
  @ApiResponse({ status: 404, description: 'Memory not found' })
  async linkUrlPagesToMemory(
    @Request() req,
    @Body() body: { memoryId: string; urlPageIds: string[] },
  ) {
    const userId = req.user.id;
    return this.urlPagesService.linkUrlPagesToMemory(userId, body.memoryId, body.urlPageIds);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a URL page' })
  @ApiResponse({ status: 200, description: 'URL page deleted successfully' })
  @ApiResponse({ status: 404, description: 'URL page not found' })
  async deleteUrlPage(@Request() req, @Param('id') urlPageId: string) {
    const userId = req.user.id;
    await this.urlPagesService.deleteUrlPage(userId, urlPageId);
    return { message: 'URL page deleted successfully' };
  }
}
