import { SetMetadata } from '@nestjs/common';

export const USAGE_RESOURCE_KEY = 'usage_resource';
export const UsageResource = (resource: 'memories' | 'images' | 'voice' | 'searches') =>
  SetMetadata(USAGE_RESOURCE_KEY, resource);

