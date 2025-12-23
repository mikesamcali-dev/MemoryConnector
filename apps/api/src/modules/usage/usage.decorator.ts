import { SetMetadata } from '@nestjs/common';
import { ResourceType } from './usage.service';
import { USAGE_RESOURCE_KEY } from './usage.guard';

export const UsageLimit = (resource: ResourceType) =>
  SetMetadata(USAGE_RESOURCE_KEY, resource);
