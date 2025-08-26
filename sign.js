const crypto = require('crypto');

const secret = 'sk_test_3d31193c191f4e0f1dfbcb13ee0773af1f8803d3'; // use your .env PAYSTACK_SECRET_KEY
const body = JSON.stringify({ event: 'charge.success' }); // the payload you want to test

const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');

console.log('Signature:', hash);
