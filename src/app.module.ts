import { McpApp, Module, ConfigModule } from '@nitrostack/core';
import { OauthModule } from './modules/oauth/oauth.module.js';
import { SocialModule } from './modules/social/social.module.js';
import { GmailModule } from './modules/gmail/gmail.module.js';
import { SystemHealthCheck } from './health/system.health.js';

import * as fs from 'fs';

function getTruePort(): number {
  try {
    const env = fs.readFileSync('/proc/self/environ', 'utf8');
    const portMatch = env.split('\0').find(e => e.startsWith('PORT='));
    if (portMatch) {
      const port = parseInt(portMatch.split('=')[1], 10);
      if (!isNaN(port)) return port;
    }
  } catch (e) {}
  return process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
}

/**
 * Root Application Module
 * 
 * This is the main module that bootstraps the MCP server.
 * It registers all feature modules and health checks.
 */
@McpApp({
  module: AppModule,
  server: {
    name: 'royal-cats-market',
    version: '1.0.0'
  },
  logging: {
    level: 'info'
  },
  transport: {
    type: process.env.NODE_ENV === 'production' ? 'dual' : 'stdio',
    http: {
      port: getTruePort(),
      host: '0.0.0.0'
    }
  }
})
@Module({
  name: 'app',
  description: 'Root application module',
  imports: [
    ConfigModule.forRoot(),
    OauthModule,
    SocialModule,
    GmailModule
  ],
  providers: [
    // Health Checks
    SystemHealthCheck,
  ]
})
export class AppModule {}

