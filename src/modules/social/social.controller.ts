import { ControllerDecorator as Controller, ToolDecorator as Tool, ExecutionContext, z, Injectable } from '@nitrostack/core';
import { SocialService } from './social.service.js';

@Injectable()
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Tool({
    name: 'facebook_post',
    description: 'Create a post on the connected Facebook Page.',
    inputSchema: z.object({
      message: z.string().describe('The message content of the post.'),
      link: z.string().optional().describe('An optional URL link to attach to the post.')
    })
  })
  async facebookPost(input: any, ctx: ExecutionContext) {
    try {
      const result = await this.socialService.postToFacebook(input.message, input.link);
      return { success: true, result };
    } catch (error: any) {
      ctx.logger.error('Facebook post failed: ' + error.message);
      return { error: 'Failed to create Facebook post', details: error.message };
    }
  }

  @Tool({
    name: 'facebook_analytics',
    description: 'Get insights and analytics for the connected Facebook Page.',
    inputSchema: z.object({})
  })
  async facebookAnalytics(input: any, ctx: ExecutionContext) {
    try {
      const result = await this.socialService.getFacebookAnalytics();
      return { success: true, data: result };
    } catch (error: any) {
      ctx.logger.error('Facebook analytics failed: ' + error.message);
      return { error: 'Failed to fetch Facebook analytics', details: error.message };
    }
  }

  @Tool({
    name: 'instagram_post',
    description: 'Publish an image post to the connected Instagram account.',
    inputSchema: z.object({
      image_url: z.string().describe('The URL of the image to post.'),
      caption: z.string().optional().describe('Optional caption for the Instagram post.')
    })
  })
  async instagramPost(input: any, ctx: ExecutionContext) {
    try {
      const result = await this.socialService.postToInstagram(input.image_url, input.caption);
      return { success: true, result };
    } catch (error: any) {
      ctx.logger.error('Instagram post failed: ' + error.message);
      return { error: 'Failed to create Instagram post', details: error.message };
    }
  }

  @Tool({
    name: 'instagram_analytics',
    description: 'Get insights and analytics for the connected Instagram account.',
    inputSchema: z.object({})
  })
  async instagramAnalytics(input: any, ctx: ExecutionContext) {
    try {
      const result = await this.socialService.getInstagramAnalytics();
      return { success: true, data: result };
    } catch (error: any) {
      ctx.logger.error('Instagram analytics failed: ' + error.message);
      return { error: 'Failed to fetch Instagram analytics', details: error.message };
    }
  }

  @Tool({
    name: 'linkedin_post',
    description: 'Publish a text or link post to LinkedIn.',
    inputSchema: z.object({
      text: z.string().describe('The text content of the LinkedIn post.')
    })
  })
  async linkedinPost(input: any, ctx: ExecutionContext) {
    try {
      const result = await this.socialService.postToLinkedIn(input.text);
      return { success: true, result };
    } catch (error: any) {
      ctx.logger.error('LinkedIn post failed: ' + error.message);
      return { error: 'Failed to create LinkedIn post', details: error.message };
    }
  }

  @Tool({
    name: 'linkedin_analytics',
    description: 'Get basic profile analytics/insights for LinkedIn.',
    inputSchema: z.object({})
  })
  async linkedinAnalytics(input: any, ctx: ExecutionContext) {
    try {
      const result = await this.socialService.getLinkedInAnalytics();
      return { success: true, data: result };
    } catch (error: any) {
      ctx.logger.error('LinkedIn analytics failed: ' + error.message);
      return { error: 'Failed to fetch LinkedIn analytics', details: error.message };
    }
  }
}
