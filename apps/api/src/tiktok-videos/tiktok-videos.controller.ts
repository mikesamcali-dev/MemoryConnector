import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TikTokVideosService } from './tiktok-videos.service';
import { CreateTikTokVideoDto } from './dto/create-tiktok-video.dto';
import { UpdateTikTokVideoDto } from './dto/update-tiktok-video.dto';
import { ExtractMetadataDto } from './dto/extract-metadata.dto';

@ApiTags('TikTok Videos')
@Controller('tiktok-videos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TikTokVideosController {
  constructor(private readonly tiktokVideosService: TikTokVideosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new TikTok video entry' })
  async create(@Body() createDto: CreateTikTokVideoDto) {
    return this.tiktokVideosService.create(createDto);
  }

  @Post('extract-metadata')
  @ApiOperation({ summary: 'Extract metadata from TikTok URL using OpenAI' })
  async extractMetadata(@Body() extractDto: ExtractMetadataDto) {
    return this.tiktokVideosService.extractMetadata(extractDto.url);
  }

  @Get()
  @ApiOperation({ summary: 'Get all TikTok videos' })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNum = skip ? parseInt(skip) : 0;
    const takeNum = take ? parseInt(take) : 50;
    return this.tiktokVideosService.findAll(skipNum, takeNum);
  }

  @Get('creator/:creatorUsername')
  @ApiOperation({ summary: 'Get TikTok videos by creator' })
  async findByCreator(
    @Param('creatorUsername') creatorUsername: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNum = skip ? parseInt(skip) : 0;
    const takeNum = take ? parseInt(take) : 20;
    return this.tiktokVideosService.findByCreator(creatorUsername, skipNum, takeNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get TikTok video by ID' })
  async findOne(@Param('id') id: string) {
    return this.tiktokVideosService.findById(id);
  }

  @Get(':id/memories')
  @ApiOperation({ summary: 'Get memories linked to this video' })
  async getMemories(@Param('id') id: string) {
    return this.tiktokVideosService.getMemoriesForVideo(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a TikTok video' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateTikTokVideoDto) {
    return this.tiktokVideosService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a TikTok video' })
  async delete(@Param('id') id: string) {
    return this.tiktokVideosService.delete(id);
  }

  @Post(':id/enrich')
  @ApiOperation({ summary: 'Re-enrich TikTok video with Whisper transcription' })
  async enrich(@Param('id') id: string) {
    return this.tiktokVideosService.enrichVideo(id);
  }
}
