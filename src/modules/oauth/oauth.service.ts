import 'dotenv/config';
import { Injectable } from '@nitrostack/core';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const TOKEN_FILE_PATH = path.join(process.cwd(), '.tokens.json');

@Injectable()
export class OauthService {
  private oauth2Client;
  
  constructor() {
    const clientId = (process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id').trim();
    const clientSecret = (process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || 'placeholder_client_secret').trim();
    const redirectUri = (process.env.GOOGLE_OAUTH_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback').trim();

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    this.loadStoredTokens();
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
    try {
      fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(tokens, null, 2));
      console.log('Successfully saved OAuth tokens to .tokens.json');
    } catch (e: any) {
      console.error('Failed to save tokens to file:', e.message);
    }
    console.log('Successfully authenticated with Google Drive and stored tokens.');
    console.log('Tokens received:', Object.keys(tokens));
    console.log('Credentials after set:', Object.keys(this.oauth2Client.credentials));
  }

  private loadStoredTokens(): void {
    try {
      if (fs.existsSync(TOKEN_FILE_PATH)) {
        const data = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8');
        const tokens = JSON.parse(data);
        this.oauth2Client.setCredentials(tokens);
        console.log('Loaded stored Google OAuth tokens from .tokens.json');
      }
    } catch (e: any) {
      console.error('Failed to load stored tokens:', e.message);
    }
  }

  getDriveClient() {
    return google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  async listDriveFiles() {
    this.loadStoredTokens();
    console.log('listDriveFiles called. Credentials present:', Object.keys(this.oauth2Client.credentials));
    const drive = this.getDriveClient();
    const res = await drive.files.list({
      pageSize: 10,
      fields: 'nextPageToken, files(id, name, mimeType)',
    });
    return res.data.files || [];
  }
}

export const globalOauthService = new OauthService();
