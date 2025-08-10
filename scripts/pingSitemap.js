// scripts/pingSitemap.js
import https from 'https';

const sitemapUrl = 'https://gradeidea.cc/sitemap.xml';
const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

https.get(pingUrl, (res) => {
  console.log(`Sitemap ping status: ${res.statusCode}`);
}).on('error', (err) => {
  console.error(`Error pinging sitemap: ${err.message}`);
});
