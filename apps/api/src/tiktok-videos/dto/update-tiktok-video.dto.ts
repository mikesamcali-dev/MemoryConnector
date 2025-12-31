import { PartialType } from '@nestjs/swagger';
import { CreateTikTokVideoDto } from './create-tiktok-video.dto';

export class UpdateTikTokVideoDto extends PartialType(CreateTikTokVideoDto) {}
