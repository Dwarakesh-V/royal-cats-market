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
}
