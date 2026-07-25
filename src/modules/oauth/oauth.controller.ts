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
    description: 'Lists up to 50 files from a specific folder in the authenticated user\'s Google Drive.',
    inputSchema: z.object({
      folder_id: z.string().optional().describe('The ID of the folder to list files from. Defaults to "root".')
    })
  })
  async listFiles(input: any, ctx: ExecutionContext) {
    try {
      if (!globalOauthService) {
        throw new Error('OAuth service is not initialized');
      }
      const files = await globalOauthService.listDriveFiles(input.folder_id);
      return { files };
    } catch (error: any) {
      ctx.logger.error('Failed to list files: ' + error.message);
      return { error: 'Failed to list files. Ensure the user has authenticated via the generate_auth_url tool first.', details: error.message };
    }
  }

  @Tool({
    name: 'read_file',
    description: 'Retrieves the textual contents of a file from Google Drive. Automatically exports Google Docs/Sheets to readable text.',
    inputSchema: z.object({
      file_id: z.string().describe('The exact ID of the file to read (obtained from list_files)')
    })
  })
  async readFile(input: any, ctx: ExecutionContext) {
    try {
      if (!globalOauthService) {
        throw new Error('OAuth service is not initialized');
      }
      const result = await globalOauthService.readFileContent(input.file_id);
      return result;
    } catch (error: any) {
      ctx.logger.error('Failed to read file: ' + error.message);
      return { error: 'Failed to read file contents.', details: error.message };
    }
  }
}
