import 'dotenv/config';

async function listPosts() {
    const posts = [];
    const { FB_PAGE_ID, IG_USER_ID, FB_API_VERSION, PAGE_ACCESS_TOKEN } = process.env;

    console.log("Tokens:", { FB_PAGE_ID, IG_USER_ID, FB_API_VERSION, PAGE_ACCESS_TOKEN: PAGE_ACCESS_TOKEN ? 'EXISTS' : 'MISSING' });

    if (FB_PAGE_ID && PAGE_ACCESS_TOKEN) {
      try {
        const url = `https://graph.facebook.com/${FB_API_VERSION || 'v21.0'}/${FB_PAGE_ID}/published_posts?fields=id,message,created_time&access_token=${PAGE_ACCESS_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log("FB response status:", res.status);
        console.log("FB data:", JSON.stringify(data).slice(0, 200));
        if (data.data) {
          data.data.forEach((p) => {
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
        const data = await res.json();
        console.log("IG response status:", res.status);
        console.log("IG data:", JSON.stringify(data).slice(0, 200));
        if (data.data) {
          data.data.forEach((p) => {
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

    console.log("Final posts array:", posts);
}

listPosts();
