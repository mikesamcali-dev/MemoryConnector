import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { ImagesService } from './images.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { LinkImageDto, LinkImagesToMemoryDto } from './dto/link-image.dto';

@ApiTags('images')
@Controller('images')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload an image' })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid image format or data' })
  @ApiResponse({ status: 413, description: 'Image too large' })
  async uploadImage(@Body() uploadDto: UploadImageDto, @User() user: any) {
    return this.imagesService.uploadImage(user.id, uploadDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all images for the current user' })
  @ApiResponse({ status: 200, description: 'Images retrieved successfully' })
  async getUserImages(
    @User() user: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.imagesService.getUserImages(
      user.id,
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific image by ID' })
  @ApiResponse({ status: 200, description: 'Image retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async getImage(@Param('id') id: string, @User() user: any) {
    return this.imagesService.getImageById(user.id, id);
  }

  @Post('link')
  @ApiOperation({ summary: 'Link an image to a memory' })
  @ApiResponse({ status: 201, description: 'Image linked to memory successfully' })
  @ApiResponse({ status: 404, description: 'Image or memory not found' })
  async linkImage(@Body() linkDto: LinkImageDto, @User() user: any) {
    return this.imagesService.linkImageToMemory(user.id, linkDto.imageId, linkDto.memoryId);
  }

  @Post('link-multiple')
  @ApiOperation({ summary: 'Link multiple images to a memory' })
  @ApiResponse({ status: 201, description: 'Images linked to memory successfully' })
  @ApiResponse({ status: 404, description: 'Memory not found' })
  async linkMultipleImages(@Body() linkDto: LinkImagesToMemoryDto & { memoryId: string }, @User() user: any) {
    return this.imagesService.linkImagesToMemory(user.id, linkDto.memoryId, linkDto.imageIds);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an image' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async deleteImage(@Param('id') id: string, @User() user: any) {
    await this.imagesService.deleteImage(user.id, id);
    return { message: 'Image deleted successfully' };
  }
}
