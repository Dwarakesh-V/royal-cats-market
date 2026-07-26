import { SocialService } from './src/modules/social/social.service.js';
import { GmailService } from './src/modules/gmail/gmail.service.js';

/**
 * Fetches per-post analytics from any platform for a given post ID.
 */
async function fetchPerPostAnalytics(platform: 'facebook' | 'instagram' | 'linkedin', postId: string) {
  console.log(`\n📊 Fetching per-post stats for ${platform} post: ${postId}`);
  try {
    let url = '';
    let headers: any = {};
    
    if (platform === 'facebook') {
      // Basic post insights and engagement
      url = `https://graph.facebook.com/v21.0/${postId}?fields=id,message,likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions,post_engagements)&access_token=${process.env.PAGE_ACCESS_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN}`;
    } else if (platform === 'instagram') {
      // Valid metrics for images and standard posts (impressions removed for v22.0+)
      url = `https://graph.facebook.com/v21.0/${postId}/insights?metric=reach,saved,likes,comments,shares,total_interactions&access_token=${process.env.PAGE_ACCESS_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN}`;
    } else if (platform === 'linkedin') {
      // Basic social actions (likes, comments) using the newer standard endpoints
      url = `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postId)}`;
      headers = { 
        'Authorization': `Bearer ${process.env.LI_ACCESS_TOKEN || process.env.LINKEDIN_ACCESS_TOKEN}`, 
        'X-Restli-Protocol-Version': '2.0.0' 
      };
    }

    const res = await fetch(url, { headers });
    const data = await res.json();
    console.log(`   -> Result:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error(`❌ Failed to fetch stats for ${platform}:`, error.message);
  }
}

async function testIntegrations() {
  console.log('🚀 Starting integration tests...\n');

  const socialService = new SocialService();
  const gmailService = new GmailService();

  // 1. Post to Facebook
  try {
    console.log('1️⃣ Testing Facebook Post...');
    const fbPostRes = await socialService.postToFacebook('Hello from NitroStack integration test!', 'https://nitrostack.ai');
    console.log('✅ Facebook Post Success:', fbPostRes);
    if (fbPostRes && fbPostRes.id) {
      await fetchPerPostAnalytics('facebook', fbPostRes.id);
    }
  } catch (e: any) {
    console.error('❌ Facebook Post Failed:', e.message);
  }

  // 2. Read Facebook Stats
  try {
    console.log('\n2️⃣ Testing Facebook Analytics...');
    const fbStats = await socialService.getFacebookAnalytics();
    console.log('✅ Facebook Analytics Success:', JSON.stringify(fbStats, null, 2));
  } catch (e: any) {
    console.error('❌ Facebook Analytics Failed:', e.message);
  }

  // 3. Post to Instagram
  try {
    console.log('\n3️⃣ Testing Instagram Post...');
    const igPostRes = await socialService.postToInstagram('https://picsum.photos/800', 'Hello Instagram from NitroStack! #test');
    console.log('✅ Instagram Post Success:', igPostRes);
    if (igPostRes && igPostRes.id) {
      await fetchPerPostAnalytics('instagram', igPostRes.id);
    }
  } catch (e: any) {
    console.error('❌ Instagram Post Failed:', e.message);
  }

  // 4. Read Instagram Stats
  try {
    console.log('\n4️⃣ Testing Instagram Analytics...');
    const igStats = await socialService.getInstagramAnalytics();
    console.log('✅ Instagram Analytics Success:', JSON.stringify(igStats, null, 2));
  } catch (e: any) {
    console.error('❌ Instagram Analytics Failed:', e.message);
  }

  // 5. Send Gmail
  try {
    console.log('\n5️⃣ Testing Gmail Send...');
    const gmailRes = await gmailService.sendEmail('shyamstar969@gmail.com', 'Integration Test', 'This is a test email sent from the NitroStack integration test script.');
    console.log('✅ Gmail Send Success:', gmailRes?.messageId);
  } catch (e: any) {
    console.error('❌ Gmail Send Failed:', e.message);
  }

  // 6. LinkedIn Post
  try {
    console.log('\n6️⃣ Testing LinkedIn Post...');
    const liPostRes = await socialService.postToLinkedIn('Hello LinkedIn network! This is a test post from my NitroStack integration test script.');
    console.log('✅ LinkedIn Post Success:', liPostRes);
  } catch (e: any) {
    console.error('❌ LinkedIn Post Failed:', e.message);
  }

  console.log('\n🏁 Integration tests finished.');
}

// -------------------------------------------------------------
// CLI Argument Handling for querying ANY specific post
// -------------------------------------------------------------
const args = process.argv.slice(2);
if (args[0] === 'analytics' && args[1] && args[2]) {
  // Example: npx tsx test-integrations.ts analytics instagram 1234567890
  const platform = args[1] as 'facebook' | 'instagram' | 'linkedin';
  const postId = args[2];
  fetchPerPostAnalytics(platform, postId).catch(console.error);
} else {
  // Run the full test suite
  testIntegrations().catch(console.error);
}
