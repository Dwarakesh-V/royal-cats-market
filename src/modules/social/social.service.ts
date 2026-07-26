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
    return data;
  }

  async getFacebookAnalytics() {
    const url = new URL(`${this.fbBaseUrl}/${this.fbPageId}/insights`);
    url.searchParams.append('metric', 'page_impressions,page_engaged_users');
    url.searchParams.append('access_token', this.fbPageAccessToken);

    const res = await fetch(url.toString());
    const data: any = await res.json();
    if (!res.ok) throw new Error(`Facebook analytics failed: ${JSON.stringify(data)}`);
    return data;
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

    const publishUrl = new URL(`${this.fbBaseUrl}/${this.igUserId}/media_publish`);
    publishUrl.searchParams.append('access_token', this.fbPageAccessToken);
    publishUrl.searchParams.append('creation_id', creationId);

    const publishRes = await fetch(publishUrl.toString(), { method: 'POST' });
    const publishData: any = await publishRes.json();
    if (!publishRes.ok) throw new Error(`Instagram media publish failed: ${JSON.stringify(publishData)}`);
    return publishData;
  }

  async getInstagramAnalytics() {
    const url = new URL(`${this.fbBaseUrl}/${this.igUserId}/insights`);
    url.searchParams.append('metric', 'impressions,reach');
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
       return { success: true, id };
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
