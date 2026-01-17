import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ImplementationIntentionsService } from './implementation-intentions.service';
import { CreateIntentionDto, UpdateIntentionDto } from './dto';

@ApiTags('intentions')
@Controller('intentions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImplementationIntentionsController {
  constructor(private readonly service: ImplementationIntentionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new implementation intention' })
  create(@Req() req: any, @Body() dto: CreateIntentionDto) {
    return this.service.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all intentions' })
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.userId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active intentions only' })
  findActive(@Req() req: any) {
    return this.service.findActive(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific intention' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update intention' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateIntentionDto) {
    return this.service.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete intention' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.userId, id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark intention as completed' })
  markCompleted(@Req() req: any, @Param('id') id: string) {
    return this.service.markCompleted(req.user.userId, id);
  }

  @Post(':id/snooze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Snooze intention' })
  snooze(@Req() req: any, @Param('id') id: string) {
    return this.service.snooze(req.user.userId, id);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume paused intention' })
  resume(@Req() req: any, @Param('id') id: string) {
    return this.service.resume(req.user.userId, id);
  }
}
