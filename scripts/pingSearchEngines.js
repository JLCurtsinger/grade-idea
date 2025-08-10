// scripts/pingSearchEngines.js
import https from 'https';

const SITE = 'https://gradeidea.cc';
const SITEMAP = `${SITE}/sitemap.xml`;
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '8c2c3c6c1a7d4b4c99f2a8d1b7e5f3a2'; // must match public/indexnow.txt

function get(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => resolve({ url, status: res.statusCode })).on('error', () => resolve({ url, status: 'ERR' }));
  });
}

function postJson(url, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }}, (res) => {
      resolve({ url, status: res.statusCode });
    });
    req.on('error', () => resolve({ url, status: 'ERR' }));
    req.write(data);
    req.end();
  });
}

(async () => {
  const results = [];
  // Google sitemap ping
  results.push(await get(`https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`));
  // Bing sitemap ping
  results.push(await get(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`));
  // IndexNow submit: we'll send the homepage and sitemap URL to trigger recrawl
  results.push(await postJson('https://api.indexnow.org/indexnow', {
    host: 'gradeidea.cc',
    key: INDEXNOW_KEY,
    keyLocation: `${SITE}/indexnow.txt`,
    urlList: [SITE, SITEMAP],
  }));

  console.log('Ping results:', results);
})();
