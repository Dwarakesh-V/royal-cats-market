import 'dotenv/config';
import { Injectable } from '@nitrostack/core';

@Injectable()
export class SocialService {
  private fbBaseUrl = (process.env.FB_BASE_URL || 'https://graph.facebook.com/v21.0').trim();
  private fbPageAccessToken = (process.env.PAGE_ACCESS_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN || '').replace(/['"]+/g, '').trim();
  private fbPageId = (process.env.FB_PAGE_ID || '').replace(/['"]+/g, '').trim();
  private igUserId = (process.env.IG_USER_ID || '').replace(/['"]+/g, '').trim();

  private linkedInAccessToken = (process.env.LI_ACCESS_TOKEN || process.env.LINKEDIN_ACCESS_TOKEN || '').replace(/['"]+/g, '').trim();
  private linkedInUrnString = (process.env.LI_URN || process.env.LINKEDIN_URN_STRING || '').replace(/['"]+/g, '').trim();

  // Facebook
  async postToFacebook(message: string, link?: string) {
    const url = new URL(`${this.fbBaseUrl}/${this.fbPageId}/feed`);
    url.searchParams.append('access_token', this.fbPageAccessToken);
    url.searchParams.append('message', message);
    if (link) url.searchParams.append('link', link);

    const res = await fetch(url.toString(), { method: 'POST' });
    const data: any = await res.json();
    if (!res.ok) throw new Error(`Facebook post failed: ${JSON.stringify(data)}`);
    
    let postAnalytics = null;
    try {
      if (data.id) {
        const statsUrl = `https://graph.facebook.com/v21.0/${data.id}?fields=id,message,likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions,post_engagements)&access_token=${this.fbPageAccessToken}`;
        const statsRes = await fetch(statsUrl);
        const statsData: any = await statsRes.json();
        postAnalytics = statsData.error ? { fallback: true, error: statsData.error.message } : statsData;
      }
    } catch (e: any) {
      postAnalytics = { fallback: true, error: e.message };
    }

    return { ...data, post_analytics: postAnalytics };
  }

  async getFacebookAnalytics() {
    // 1. Fetch basic robust page analytics
    const pageUrl = new URL(`${this.fbBaseUrl}/${this.fbPageId}`);
    pageUrl.searchParams.append('fields', 'followers_count,fan_count,new_like_count,rating_count,talking_about_count');
    pageUrl.searchParams.append('access_token', this.fbPageAccessToken);

    const pageRes = await fetch(pageUrl.toString());
    const pageData: any = await pageRes.json();
    if (!pageRes.ok) throw new Error(`Facebook page analytics failed: ${JSON.stringify(pageData)}`);

    // 2. Fetch per-post analytics (recent 5 posts)
    const postsUrl = new URL(`${this.fbBaseUrl}/${this.fbPageId}/published_posts`);
    postsUrl.searchParams.append('fields', 'id,message,created_time,likes.summary(true),comments.summary(true),shares');
    postsUrl.searchParams.append('limit', '5');
    postsUrl.searchParams.append('access_token', this.fbPageAccessToken);

    const postsRes = await fetch(postsUrl.toString());
    const postsData: any = await postsRes.json();
    
    const recentPosts = (postsData.data || []).map((post: any) => ({
      id: post.id,
      message: post.message ? post.message.substring(0, 50) + '...' : '',
      created_time: post.created_time,
      likes: post.likes?.summary?.total_count || 0,
      comments: post.comments?.summary?.total_count || 0,
      shares: post.shares?.count || 0
    }));

    return {
      page_metrics: pageData,
      recent_posts_metrics: recentPosts
    };
  }

  // Instagram
  async postToInstagram(imageUrl: string, caption?: string) {
    const createUrl = new URL(`${this.fbBaseUrl}/${this.igUserId}/media`);
    createUrl.searchParams.append('access_token', this.fbPageAccessToken);
    createUrl.searchParams.append('image_url', imageUrl);
    if (caption) createUrl.searchParams.append('caption', caption);

    const createRes = await fetch(createUrl.toString(), { method: 'POST' });
    const createData: any = await createRes.json();
    if (!createRes.ok) throw new Error(`Instagram media creation failed: ${JSON.stringify(createData)}`);
    const creationId = createData.id;

    // Add a short delay to allow Instagram to process the image before publishing
    await new Promise(resolve => setTimeout(resolve, 3000));

    const publishUrl = new URL(`${this.fbBaseUrl}/${this.igUserId}/media_publish`);
    publishUrl.searchParams.append('access_token', this.fbPageAccessToken);
    publishUrl.searchParams.append('creation_id', creationId);

    const publishRes = await fetch(publishUrl.toString(), { method: 'POST' });
    const publishData: any = await publishRes.json();
    if (!publishRes.ok) throw new Error(`Instagram media publish failed: ${JSON.stringify(publishData)}`);
    
    let postAnalytics = null;
    try {
      if (publishData.id) {
        const statsUrl = `https://graph.facebook.com/v21.0/${publishData.id}/insights?metric=reach,saved,likes,comments,shares,total_interactions&access_token=${this.fbPageAccessToken}`;
        const statsRes = await fetch(statsUrl);
        const statsData: any = await statsRes.json();
        postAnalytics = statsData.error ? { fallback: true, error: statsData.error.message } : statsData;
      }
    } catch (e: any) {
      postAnalytics = { fallback: true, error: e.message };
    }

    return { ...publishData, post_analytics: postAnalytics };
  }

  async getInstagramAnalytics() {
    const url = new URL(`${this.fbBaseUrl}/${this.igUserId}/insights`);
    url.searchParams.append('metric', 'reach,follower_count'); // profile_views removed due to metric_type requirement
    url.searchParams.append('period', 'day');
    url.searchParams.append('access_token', this.fbPageAccessToken);

    const res = await fetch(url.toString());
    const data: any = await res.json();
    if (!res.ok) throw new Error(`Instagram analytics failed: ${JSON.stringify(data)}`);
    return data;
  }

  // LinkedIn
  async postToLinkedIn(text: string) {
    const url = 'https://api.linkedin.com/v2/ugcPosts';
    const body = {
      author: this.linkedInUrnString,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.linkedInAccessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(body)
    });

    if (res.status === 201) {
       const id = res.headers.get('x-restli-id');
       let postAnalytics = null;
       if (id) {
         try {
           const statsUrl = `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(id)}`;
           const statsRes = await fetch(statsUrl, {
             headers: { 
               'Authorization': `Bearer ${this.linkedInAccessToken}`, 
               'X-Restli-Protocol-Version': '2.0.0' 
             }
           });
           const statsData: any = await statsRes.json();
           postAnalytics = statsData.error || statsData.status >= 400 ? { fallback: true, error: statsData.message || 'API Error' } : statsData;
         } catch (e: any) {
           postAnalytics = { fallback: true, error: e.message };
         }
       }
       return { success: true, id, post_analytics: postAnalytics };
    }

    const data = await res.text();
    if (!res.ok) throw new Error(`LinkedIn post failed: ${data}`);
    
    try {
      return JSON.parse(data);
    } catch (e) {
      return { data };
    }
  }

  async getLinkedInAnalytics() {
    const url = new URL(`https://api.linkedin.com/v2/me`);
    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.linkedInAccessToken}`,
      }
    });
    const data: any = await res.json();
    if (!res.ok) throw new Error(`LinkedIn analytics failed: ${JSON.stringify(data)}`);
    return data;
  }
}

export const globalSocialService = new SocialService();

