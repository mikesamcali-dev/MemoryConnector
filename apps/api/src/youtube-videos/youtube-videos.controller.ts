import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { YouTubeVideosService } from './youtube-videos.service';
import { CreateYouTubeVideoDto } from './dto/create-youtube-video.dto';
import { UpdateYouTubeVideoDto } from './dto/update-youtube-video.dto';
import { IngestYouTubeUrlDto } from './dto/ingest-youtube-url.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('youtube-videos')
@Controller('youtube-videos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class YouTubeVideosController {
  constructor(private readonly youtubeVideosService: YouTubeVideosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new YouTube video record' })
  async create(@Body() createDto: CreateYouTubeVideoDto) {
    return this.youtubeVideosService.create(createDto);
  }

  @Post('from-url')
  @ApiOperation({ summary: 'Create video from URL (auto-fetches metadata)' })
  async createFromUrl(@Body() body: { url: string }) {
    return this.youtubeVideosService.createFromUrl(body.url);
  }

  @Get()
  @ApiOperation({ summary: 'Get all YouTube videos' })
  async findAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    const skipNum = skip ? parseInt(skip) : 0;
    const takeNum = take ? parseInt(take) : 50;
    return this.youtubeVideosService.findAll(skipNum, takeNum);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search YouTube videos' })
  async search(
    @Query('q') query: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNum = skip ? parseInt(skip) : 0;
    const takeNum = take ? parseInt(take) : 20;
    return this.youtubeVideosService.search(query, skipNum, takeNum);
  }

  @Get('by-url')
  @ApiOperation({ summary: 'Find video by canonical URL' })
  async findByUrl(@Query('url') url: string) {
    return this.youtubeVideosService.findByUrl(url);
  }

  @Get('by-youtube-id/:youtubeVideoId')
  @ApiOperation({ summary: 'Find video by YouTube video ID' })
  async findByYouTubeId(@Param('youtubeVideoId') youtubeVideoId: string) {
    return this.youtubeVideosService.findByYouTubeId(youtubeVideoId);
  }

  @Get('by-channel/:channelId')
  @ApiOperation({ summary: 'Get videos by channel ID' })
  async findByChannel(
    @Param('channelId') channelId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNum = skip ? parseInt(skip) : 0;
    const takeNum = take ? parseInt(take) : 20;
    return this.youtubeVideosService.findByChannel(channelId, skipNum, takeNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get YouTube video by ID' })
  async findOne(@Param('id') id: string) {
    return this.youtubeVideosService.findById(id);
  }

  @Get(':id/memories')
  @ApiOperation({ summary: 'Get memories linked to this video' })
  async getMemories(@Param('id') id: string) {
    return this.youtubeVideosService.getMemoriesForVideo(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a YouTube video' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateYouTubeVideoDto) {
    return this.youtubeVideosService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a YouTube video' })
  async delete(@Param('id') id: string) {
    return this.youtubeVideosService.delete(id);
  }

  @Post('extract-video-id')
  @ApiOperation({ summary: 'Extract YouTube video ID from URL' })
  async extractVideoId(@Body() body: { url: string }) {
    const videoId = this.youtubeVideosService.extractVideoIdFromUrl(body.url);
    return {
      url: body.url,
      videoId,
      canonicalUrl: videoId
        ? this.youtubeVideosService.buildCanonicalUrl(videoId)
        : null,
    };
  }

  @Post(':id/enrich')
  @ApiOperation({ summary: 'Manually trigger enrichment for a video' })
  async enrichVideo(@Param('id') id: string) {
    return this.youtubeVideosService.triggerEnrichment(id);
  }
}
