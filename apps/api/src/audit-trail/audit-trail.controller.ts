import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditTrailService, AuditTrailFilters } from './audit-trail.service';

@ApiTags('Audit Trail')
@ApiBearerAuth()
@Controller('audit-trail')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditTrailController {
  constructor(private auditTrailService: AuditTrailService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get audit trail events with filters (Admin only)' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'entityName', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'success', required: false, type: Boolean })
  @ApiQuery({ name: 'actorType', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query() query: any) {
    const filters: AuditTrailFilters = {
      userId: query.userId,
      eventType: query.eventType,
      action: query.action,
      entityName: query.entityName,
      entityId: query.entityId,
      success: query.success === 'true' ? true : query.success === 'false' ? false : undefined,
      actorType: query.actorType,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      search: query.search,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
    };

    return this.auditTrailService.findAll(filters);
  }

  @Get('stats')
  @Roles('admin')
  @ApiOperation({ summary: 'Get audit trail statistics (Admin only)' })
  async getStats() {
    return this.auditTrailService.getStats();
  }

  @Get('event-types')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all event types with counts (Admin only)' })
  async getEventTypes() {
    return this.auditTrailService.getEventTypes();
  }

  @Get('actions')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all actions with counts (Admin only)' })
  async getActions() {
    return this.auditTrailService.getActions();
  }

  @Get('entity-names')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all entity names with counts (Admin only)' })
  async getEntityNames() {
    return this.auditTrailService.getEntityNames();
  }

  @Get('entity/:entityName/:entityId')
  @Roles('admin')
  @ApiOperation({ summary: 'Get timeline for specific entity (Admin only)' })
  async getTimelineForEntity(
    @Param('entityName') entityName: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditTrailService.getTimelineForEntity(entityName, entityId);
  }

  @Get('user/:userId')
  @Roles('admin')
  @ApiOperation({ summary: 'Get user activity (Admin only)' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days) : 7;
    return this.auditTrailService.getUserActivity(userId, daysNum);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get single audit trail event by ID (Admin only)' })
  async findById(@Param('id') id: string) {
    return this.auditTrailService.findById(id);
  }
}
