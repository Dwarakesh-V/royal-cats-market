import { ControllerDecorator as Controller, ToolDecorator as Tool, Widget, z } from '@nitrostack/core';

@Controller('social')
export class SocialController {
  @Tool({
    name: 'view_live_analytics',
    description: 'View live analytics for a social media post.',
    inputSchema: z.object({
      postId: z.string().describe('The ID of the post to view analytics for.')
    })
  })
  @Widget('live-analytics')
  async viewLiveAnalytics(input: { postId: string }) {
    // Strictly return the postId so the frontend can handle the live polling
    return {
      widgetProps: {
        postId: input.postId
      }
    };
  }

  @Tool({
    name: 'list_posts',
    description: 'Lists all available social media posts from integrated platforms.',
    inputSchema: z.object({})
  })
  @Widget('post-selector')
  async listPosts() {
    const posts: any[] = [];
    const { FB_PAGE_ID, IG_USER_ID, FB_API_VERSION, PAGE_ACCESS_TOKEN } = process.env;

    if (FB_PAGE_ID && PAGE_ACCESS_TOKEN) {
      try {
        const url = `https://graph.facebook.com/${FB_API_VERSION || 'v21.0'}/${FB_PAGE_ID}/published_posts?fields=id,message,created_time&access_token=${PAGE_ACCESS_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json() as any;
        if (data.data) {
          data.data.forEach((p: any) => {
            posts.push({
              id: p.id,
              title: p.message ? p.message.slice(0, 30) + '...' : 'Facebook Post',
              date: p.created_time.split('T')[0],
              platforms: ['Facebook']
            });
          });
        }
      } catch (e) {
        console.error('Failed to fetch FB posts', e);
      }
    }

    if (IG_USER_ID && PAGE_ACCESS_TOKEN) {
      try {
        const url = `https://graph.facebook.com/${FB_API_VERSION || 'v21.0'}/${IG_USER_ID}/media?fields=id,caption,timestamp&access_token=${PAGE_ACCESS_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json() as any;
        if (data.data) {
          data.data.forEach((p: any) => {
            posts.push({
              id: p.id,
              title: p.caption ? p.caption.slice(0, 30) + '...' : 'Instagram Post',
              date: p.timestamp.split('T')[0],
              platforms: ['Instagram']
            });
          });
        }
      } catch (e) {
        console.error('Failed to fetch IG posts', e);
      }
    }

    return {
      widgetProps: {
        posts
      }
    };
  }
}
