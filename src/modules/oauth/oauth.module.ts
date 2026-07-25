import { Module } from '@nitrostack/core';
import { OauthService } from './oauth.service.js';
import { OauthController } from './oauth.controller.js';

@Module({
  name: 'oauth',
  providers: [OauthService, OauthController],
  exports: [OauthService]
})
export class OauthModule {}
