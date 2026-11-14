require('dotenv').config();
const http = require('http');

function postJson(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, body: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('--- TESTING LOGIN API ENDPOINTS ---');

  const testAccounts = [
    { username: 'admin', password: 'Admin@12345', expectedRole: 'Admin' },
    { username: 'security1', password: 'Security@12345', expectedRole: 'Security Officer' },
    { username: 'jsmith', password: 'Employee@12345', expectedRole: 'Employee' },
  ];

  for (const acc of testAccounts) {
    try {
      const res = await postJson('/api/auth/login', { username: acc.username, password: acc.password });
      console.log(`\nAccount: ${acc.username}`);
      console.log(`HTTP Status: ${res.status}`);
      console.log(`Response Success: ${res.body?.success}`);
      console.log(`Returned User Role: ${res.body?.data?.user?.role}`);
      console.log(`Access Token Issued: ${!!res.body?.data?.accessToken}`);
      
      if (res.status === 200 && res.body?.data?.user?.role === acc.expectedRole && res.body?.data?.accessToken) {
        console.log(`PASS: ${acc.username} logged in successfully!`);
      } else {
        console.error(`FAIL: ${acc.username} login failed!`, res.body);
      }
    } catch (err) {
      console.error(`ERROR testing ${acc.username}:`, err.message);
    }
  }
}

runTests();
