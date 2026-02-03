const axios = require('axios');
const fs = require('fs');

(async () => {
  try {
    const tokenPath = 'token.txt';
    if (!fs.existsSync(tokenPath)) {
      throw new Error(`Token file not found at ${tokenPath}`);
    }
    const token = fs.readFileSync(tokenPath, 'utf-8').trim();
    if (!token) {
      throw new Error('Token file is empty');
    }

    const base = process.env.BASE_URL || 'http://127.0.0.1:3002/api/recharge/operators';
    const types = ['creditcard', 'loan', 'insurance'];

    console.log('Using base URL:', base);
    for (const t of types) {
      const url = `${base}?type=${t}`;
      try {
        const resp = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000
        });
        const list = resp.data && resp.data.data ? resp.data.data : [];
        console.log(`Type=${t} status=${resp.status} count=${list.length}`);
        console.log('Sample:', JSON.stringify(list.slice(0, 3), null, 2));
      } catch (err) {
        const status = err.response ? err.response.status : 'NO_RESPONSE';
        console.error(`Type=${t} ERROR status=${status}`);
        if (err.response && err.response.data) {
          console.error('Body:', JSON.stringify(err.response.data, null, 2));
        } else {
          console.error('Message:', err.message);
        }
      }
    }
  } catch (fatal) {
    console.error('Fatal error:', fatal.message);
  }
})();