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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TwitterPostsService } from './twitter-posts.service';
import { CreateTwitterPostDto } from './dto/create-twitter-post.dto';
import { UpdateTwitterPostDto } from './dto/update-twitter-post.dto';
import { ExtractMetadataDto } from './dto/extract-metadata.dto';

@ApiTags('Twitter Posts')
@Controller('twitter-posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TwitterPostsController {
  constructor(private readonly twitterPostsService: TwitterPostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Twitter post entry' })
  async create(@Request() req, @Body() createDto: CreateTwitterPostDto) {
    return this.twitterPostsService.create(req.user.userId, createDto);
  }

  @Post('extract-metadata')
  @ApiOperation({ summary: 'Extract metadata from Twitter/X URL' })
  async extractMetadata(@Body() extractDto: ExtractMetadataDto) {
    return this.twitterPostsService.extractMetadata(extractDto.url);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Twitter posts for the current user' })
  async findAll(
    @Request() req,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNum = skip ? parseInt(skip) : 0;
    const takeNum = take ? parseInt(take) : 50;
    return this.twitterPostsService.findAll(req.user.userId, skipNum, takeNum);
  }

  @Get('creator/:creatorUsername')
  @ApiOperation({ summary: 'Get Twitter posts by creator for the current user' })
  async findByCreator(
    @Request() req,
    @Param('creatorUsername') creatorUsername: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNum = skip ? parseInt(skip) : 0;
    const takeNum = take ? parseInt(take) : 20;
    return this.twitterPostsService.findByCreator(req.user.userId, creatorUsername, skipNum, takeNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Twitter post by ID' })
  async findOne(@Param('id') id: string) {
    return this.twitterPostsService.findById(id);
  }

  @Get(':id/memories')
  @ApiOperation({ summary: 'Get memories linked to this post' })
  async getMemories(@Param('id') id: string) {
    return this.twitterPostsService.getMemoriesForPost(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a Twitter post' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateTwitterPostDto) {
    return this.twitterPostsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Twitter post' })
  async delete(@Param('id') id: string) {
    return this.twitterPostsService.delete(id);
  }

  @Post(':id/enrich')
  @ApiOperation({ summary: 'Enrich Twitter post with AI analysis' })
  async enrich(@Param('id') id: string) {
    return this.twitterPostsService.enrichPost(id);
  }
}
