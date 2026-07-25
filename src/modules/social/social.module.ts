import { Module } from '@nitrostack/core';
import { SocialController } from './social.controller.js';

@Module({
  name: 'social',
  description: 'Social Media Module',
  controllers: [SocialController]
})
export class SocialModule {}
