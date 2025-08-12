import https from 'https';

const BASE = 'https://www.gradeidea.cc';
const SITEMAP = `${BASE}/sitemap.xml`;
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

// Helper to GET a URL
function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const { statusCode } = res;
      res.resume();
      // Accept 410 (Gone) for deprecated endpoints like Bing ping
      if (statusCode >= 200 && statusCode < 300 || statusCode === 410) resolve(statusCode);
      else reject(new Error(`GET ${url} -> ${statusCode}`));
    }).on('error', reject);
  });
}

(async () => {
  try {
    // Bing sitemap submit endpoint (deprecated but still honored with 410)
    const bingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`;
    console.log('Pinging Bing sitemap:', bingUrl);
    const bingResult = await get(bingUrl);
    if (bingResult === 410) {
      console.log('Bing ping endpoint deprecated (410) - this is expected');
    } else {
      console.log('Bing ping successful:', bingResult);
    }

    // IndexNow URL submission for the homepage + sitemap
    if (!INDEXNOW_KEY) {
      console.warn('INDEXNOW_KEY missing; skipping IndexNow.');
    } else {
      const urls = [ `${BASE}/`, SITEMAP ];
      const indexNowEndpoint = `https://api.indexnow.org/submit?urlset=${encodeURIComponent(urls.join('\n'))}&host=www.gradeidea.cc&key=${INDEXNOW_KEY}&keyLocation=${encodeURIComponent(`${BASE}/${INDEXNOW_KEY}.txt`)}`;
      console.log('Submitting to IndexNow:', indexNowEndpoint);
      await get(indexNowEndpoint);
    }

    console.log('Ping complete.');
  } catch (err) {
    console.error('Ping failed:', err.message);
    process.exit(1);
  }
})();
