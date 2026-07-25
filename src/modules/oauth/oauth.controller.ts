import { ControllerDecorator as Controller, ToolDecorator as Tool, ExecutionContext, z, Injectable } from '@nitrostack/core';
import { OauthService, globalOauthService } from './oauth.service.js';

@Injectable()
@Controller('google_drive')
export class OauthController {
  constructor(private readonly oauthService: OauthService) {}

  @Tool({
    name: 'generate_auth_url',
    description: 'Generates the Google OAuth authorization URL. The user must visit this URL to authenticate with Google Drive.',
    inputSchema: z.object({})
  })
  async generateAuthUrl(input: any, ctx: ExecutionContext) {
    if (!globalOauthService) {
      throw new Error('OAuth service is not initialized');
    }
    const url = globalOauthService.generateAuthUrl();
    return { 
      message: 'Please visit the following URL to authorize the application:',
      url 
    };
  }

  @Tool({
    name: 'list_files',
    description: 'Lists up to 10 files from the authenticated user\'s Google Drive.',
    inputSchema: z.object({})
  })
  async listFiles(input: any, ctx: ExecutionContext) {
    try {
      if (!globalOauthService) {
        throw new Error('OAuth service is not initialized');
      }
      const files = await globalOauthService.listDriveFiles();
      return { files };
    } catch (error: any) {
      ctx.logger.error('Failed to list files: ' + error.message);
      return { error: 'Failed to list files. Ensure the user has authenticated via the generate_auth_url tool first.', details: error.message };
    }
  }
}
