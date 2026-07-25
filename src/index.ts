/**
 * Calculator MCP Server
 * 
 * Main entry point for the MCP server.
 * Uses the @McpApp decorator pattern for clean, NestJS-style architecture.
 * 
 * Transport Configuration:
 * - Development (NODE_ENV=development): STDIO only
 * - Production (NODE_ENV=production): Dual transport (STDIO + HTTP SSE)
 */

import 'dotenv/config';
import { McpApplicationFactory } from '@nitrostack/core';
import { AppModule } from './app.module.js';
import { globalOauthService } from './modules/oauth/oauth.service.js';

/**
 * Bootstrap the application
 */
async function bootstrap() {
  // Create and start the MCP server
  const server = await McpApplicationFactory.create(AppModule);
  await server.start();

  const httpTransport = server.getHttpTransport();
  if (httpTransport && httpTransport.getApp) {
    const app = httpTransport.getApp();
    app.get('/auth/callback', async (req: any, res: any) => {
      const code = req.query.code as string;
      if (!code) {
        res.status(400).send('No code provided');
        return;
      }
      try {
        if (globalOauthService) {
          await globalOauthService.handleCallback(code);
          res.send('Successfully authenticated with Google Drive! You can close this window.');
        } else {
          res.status(500).send('OAuth service not initialized');
        }
      } catch (error: any) {
        res.status(500).send('Authentication failed: ' + error.message);
      }
    });
  }
}

// Start the application
bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
