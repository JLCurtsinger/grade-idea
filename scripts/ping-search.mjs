import https from 'https';

const BASE = 'https://www.gradeidea.cc';
const SITEMAP = `${BASE}/sitemap.xml`;
const HOMEPAGE = `${BASE}/`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

// tiny helper: GET with response body
function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

// tiny helper: POST JSON
function postJSON(url, payload) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(payload));
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-length': data.length,
      },
    }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    // 1) Bing sitemap ping (returns 410 since deprecation) -> log and continue
    const bingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`;
    console.log('Pinging Bing sitemap (expect 410):', bingUrl);
    const bing = await get(bingUrl);
    console.log('Bing response:', bing.status);
    // 410 is expected; treat any network/other >=500 as warning only
    if (bing.status >= 500) {
      console.warn('Bing ping server error; continuing.');
    }

    // 2) IndexNow setup check
    if (!INDEXNOW_KEY) {
      console.warn('INDEXNOW_KEY missing; skipping IndexNow.');
      return;
    }

    const keyURL = `${BASE}/${INDEXNOW_KEY}.txt`;
    console.log('Checking IndexNow key URL:', keyURL);
    const keyRes = await get(keyURL);
    console.log('Key URL status:', keyRes.status);
    if (keyRes.status !== 200) {
      console.warn('IndexNow key file not reachable at exact keyLocation; skipping IndexNow.');
      console.warn('Expected a 200 at:', keyURL);
      return;
    }
    // The file body must equal the key exactly (no newline)
    if (keyRes.body.trim() !== INDEXNOW_KEY) {
      console.warn('IndexNow key file contents do not match INDEXNOW_KEY; skipping IndexNow.');
      return;
    }

    // 3) Submit via POST JSON (official format)
    const payload = {
      host: 'www.gradeidea.cc',            // must match the host serving the URLs
      key: INDEXNOW_KEY,
      keyLocation: keyURL,
      urlList: [HOMEPAGE, SITEMAP],        // add more URLs if desired
    };

    console.log('Submitting to IndexNow via POST JSON:', INDEXNOW_ENDPOINT);
    const ix = await postJSON(INDEXNOW_ENDPOINT, payload);
    console.log('IndexNow status:', ix.status);
    if (ix.status < 200 || ix.status >= 300) {
      console.error('IndexNow error body:', ix.body);
      process.exit(1);
    }

    console.log('IndexNow submission complete.');
  } catch (err) {
    console.error('Ping failed:', err.message);
    process.exit(1);
  }
})();
