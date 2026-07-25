import { Injectable, ConfigService } from '@nitrostack/core';
import { google } from 'googleapis';

export let globalOauthService: OauthService | null = null;

@Injectable()
export class OauthService {
  private oauth2Client;
  
  constructor(private configService: ConfigService) {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID') || 'placeholder_client_id';
    const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET') || 'placeholder_client_secret';
    const redirectUri = this.configService.get('GOOGLE_REDIRECT_URI') || 'https://royal-cats-market-6a64a-royal-cats-amrita-university-coimbatore.app.nitrocloud.ai/auth/callback';

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    
    globalOauthService = this;
  }

  generateAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async handleCallback(code: string): Promise<void> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    // Note: In a production scenario, these tokens should be saved to a database.
    // For this implementation, we will keep them in memory for the MCP server lifecycle.
    console.log('Successfully authenticated with Google Drive and stored tokens.');
  }

  getDriveClient() {
    return google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  async listDriveFiles() {
    const drive = this.getDriveClient();
    const res = await drive.files.list({
      pageSize: 10,
      fields: 'nextPageToken, files(id, name, mimeType)',
    });
    return res.data.files || [];
  }
}
