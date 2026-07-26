import 'dotenv/config';
import { Injectable } from '@nitrostack/core';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

@Injectable()
export class GmailService {
  private user = (process.env.GMAIL_USER || '').replace(/['"]+/g, '').trim();
  private pass = (process.env.GMAIL_APP_KEY || '').replace(/['"]+/g, '').trim();
  
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: this.user,
      pass: this.pass
    }
  });

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    if (!this.user || !this.pass) throw new Error('Gmail credentials not configured.');
    
    const info = await this.transporter.sendMail({
      from: this.user,
      to,
      subject,
      text,
      html
    });

    return info;
  }

  async readLimitedInbox(senderEmail: string, limit: number = 5) {
    if (!this.user || !this.pass) throw new Error('Gmail credentials not configured.');
    
    const client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: this.user,
        pass: this.pass
      },
      logger: false as any // disable verbose logging
    });

    await client.connect();

    const messages = [];
    try {
      const lock = await client.getMailboxLock('INBOX');
      try {
        // Enforce limited access by searching ONLY for a specific sender
        const searchResult = await client.search({ from: senderEmail }, { uid: true });
        const searchUids = (searchResult || []) as number[];
        
        // Take the latest N messages
        const targetUids = searchUids.slice(-limit);

        if (targetUids.length > 0) {
          const fetchSequence = targetUids.join(',');
          for await (const msg of client.fetch(fetchSequence, { source: true })) {
            const sourceBuffer = msg.source as Buffer;
            const parsed: any = await simpleParser(sourceBuffer);
            messages.push({
              uid: msg.uid,
              subject: parsed.subject,
              from: parsed.from?.text,
              date: parsed.date,
              // Return a snippet instead of the full giant HTML for safety/size constraints
              textSnippet: parsed.text ? parsed.text.substring(0, 500) + (parsed.text.length > 500 ? '...' : '') : ''
            });
          }
        }
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }
    
    // Sort descending by date
    return messages.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  }
}

export const globalGmailService = new GmailService();

