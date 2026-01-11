import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrainingsService } from './trainings.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';

@ApiTags('trainings')
@Controller('trainings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TrainingsController {
  constructor(private trainingsService: TrainingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all trainings for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns list of trainings with content counts' })
  async getAllTrainings(@Req() req: any) {
    return this.trainingsService.findAllByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a training by ID with all linked content' })
  @ApiResponse({ status: 200, description: 'Returns training details' })
  @ApiResponse({ status: 404, description: 'Training not found' })
  async getTraining(@Param('id') id: string, @Req() req: any) {
    return this.trainingsService.findById(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new training' })
  @ApiResponse({ status: 201, description: 'Training created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createTraining(@Body() dto: CreateTrainingDto, @Req() req: any) {
    return this.trainingsService.create(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a training' })
  @ApiResponse({ status: 200, description: 'Training updated successfully' })
  @ApiResponse({ status: 404, description: 'Training not found' })
  async updateTraining(
    @Param('id') id: string,
    @Body() dto: UpdateTrainingDto,
    @Req() req: any,
  ) {
    return this.trainingsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a training' })
  @ApiResponse({ status: 200, description: 'Training deleted successfully' })
  @ApiResponse({ status: 404, description: 'Training not found' })
  async deleteTraining(@Param('id') id: string, @Req() req: any) {
    return this.trainingsService.delete(id, req.user.id);
  }

  @Post(':id/memories/:memoryId')
  @ApiOperation({ summary: 'Link a memory to a training' })
  @ApiResponse({ status: 201, description: 'Memory linked successfully' })
  @ApiResponse({ status: 404, description: 'Training or memory not found' })
  @ApiResponse({ status: 409, description: 'Memory already linked to training' })
  async linkMemory(
    @Param('id') trainingId: string,
    @Param('memoryId') memoryId: string,
    @Req() req: any,
  ) {
    return this.trainingsService.linkMemoryToTraining(
      memoryId,
      trainingId,
      req.user.id,
    );
  }

  @Delete(':id/memories/:memoryId')
  @ApiOperation({ summary: 'Unlink a memory from a training' })
  @ApiResponse({ status: 200, description: 'Memory unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Training, memory, or link not found' })
  async unlinkMemory(
    @Param('id') trainingId: string,
    @Param('memoryId') memoryId: string,
    @Req() req: any,
  ) {
    return this.trainingsService.unlinkMemoryFromTraining(
      memoryId,
      trainingId,
      req.user.id,
    );
  }

  @Post(':id/images/:imageId')
  @ApiOperation({ summary: 'Link an image to a training' })
  @ApiResponse({ status: 201, description: 'Image linked successfully' })
  @ApiResponse({ status: 404, description: 'Training or image not found' })
  @ApiResponse({ status: 409, description: 'Image already linked to training' })
  async linkImage(
    @Param('id') trainingId: string,
    @Param('imageId') imageId: string,
    @Req() req: any,
  ) {
    return this.trainingsService.linkImageToTraining(
      imageId,
      trainingId,
      req.user.id,
    );
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Unlink an image from a training' })
  @ApiResponse({ status: 200, description: 'Image unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Training, image, or link not found' })
  async unlinkImage(
    @Param('id') trainingId: string,
    @Param('imageId') imageId: string,
    @Req() req: any,
  ) {
    return this.trainingsService.unlinkImageFromTraining(
      imageId,
      trainingId,
      req.user.id,
    );
  }

  @Post(':id/url-pages/:urlPageId')
  @ApiOperation({ summary: 'Link a URL page to a training' })
  @ApiResponse({ status: 201, description: 'URL page linked successfully' })
  @ApiResponse({ status: 404, description: 'Training or URL page not found' })
  @ApiResponse({ status: 409, description: 'URL page already linked to training' })
  async linkUrlPage(
    @Param('id') trainingId: string,
    @Param('urlPageId') urlPageId: string,
    @Req() req: any,
  ) {
    return this.trainingsService.linkUrlPageToTraining(
      urlPageId,
      trainingId,
      req.user.id,
    );
  }

  @Delete(':id/url-pages/:urlPageId')
  @ApiOperation({ summary: 'Unlink a URL page from a training' })
  @ApiResponse({ status: 200, description: 'URL page unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Training, URL page, or link not found' })
  async unlinkUrlPage(
    @Param('id') trainingId: string,
    @Param('urlPageId') urlPageId: string,
    @Req() req: any,
  ) {
    return this.trainingsService.unlinkUrlPageFromTraining(
      urlPageId,
      trainingId,
      req.user.id,
    );
  }

  @Post(':id/youtube-videos/:youtubeVideoId')
  @ApiOperation({ summary: 'Link a YouTube video to a training' })
  @ApiResponse({ status: 201, description: 'YouTube video linked successfully' })
  @ApiResponse({ status: 404, description: 'Training or YouTube video not found' })
  @ApiResponse({ status: 409, description: 'YouTube video already linked to training' })
  async linkYouTubeVideo(
    @Param('id') trainingId: string,
    @Param('youtubeVideoId') youtubeVideoId: string,
    @Req() req: any,
  ) {
    return this.trainingsService.linkYouTubeVideoToTraining(
      youtubeVideoId,
      trainingId,
      req.user.id,
    );
  }

  @Delete(':id/youtube-videos/:youtubeVideoId')
  @ApiOperation({ summary: 'Unlink a YouTube video from a training' })
  @ApiResponse({ status: 200, description: 'YouTube video unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Training, YouTube video, or link not found' })
  async unlinkYouTubeVideo(
    @Param('id') trainingId: string,
    @Param('youtubeVideoId') youtubeVideoId: string,
    @Req() req: any,
  ) {
    return this.trainingsService.unlinkYouTubeVideoFromTraining(
      youtubeVideoId,
      trainingId,
      req.user.id,
    );
  }

  @Post(':id/tiktok-videos/:tiktokVideoId')
  @ApiOperation({ summary: 'Link a TikTok video to a training' })
  @ApiResponse({ status: 201, description: 'TikTok video linked successfully' })
  @ApiResponse({ status: 404, description: 'Training or TikTok video not found' })
  @ApiResponse({ status: 409, description: 'TikTok video already linked to training' })
  async linkTikTokVideo(
    @Param('id') trainingId: string,
    @Param('tiktokVideoId') tiktokVideoId: string,
    @Req() req: any,
  ) {
    return this.trainingsService.linkTikTokVideoToTraining(
      tiktokVideoId,
      trainingId,
      req.user.id,
    );
  }

  @Delete(':id/tiktok-videos/:tiktokVideoId')
  @ApiOperation({ summary: 'Unlink a TikTok video from a training' })
  @ApiResponse({ status: 200, description: 'TikTok video unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Training, TikTok video, or link not found' })
  async unlinkTikTokVideo(
    @Param('id') trainingId: string,
    @Param('tiktokVideoId') tiktokVideoId: string,
    @Req() req: any,
  ) {
    return this.trainingsService.unlinkTikTokVideoFromTraining(
      tiktokVideoId,
      trainingId,
      req.user.id,
    );
  }
}
