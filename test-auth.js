const http = require('http');

function request(method, path, data = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: '/api' + path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...(cookie ? { 'Cookie': cookie } : {})
        }
      },
      (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log("=== Testing Registration ===");
  const email = `test${Date.now()}@example.com`;
  
  const regRes = await request('POST', '/auth/register', {
    name: 'Test User',
    email,
    password: 'password123'
  });
  console.log('Register Response:', regRes.status, regRes.body);
  
  console.log("\n=== Testing Duplicate Registration ===");
  const dupRes = await request('POST', '/auth/register', {
    name: 'Duplicate',
    email,
    password: 'password123'
  });
  console.log('Duplicate Register Response:', dupRes.status, dupRes.body);

  console.log("\n=== Testing Login ===");
  const loginRes = await request('POST', '/auth/login', {
    email,
    password: 'password123'
  });
  console.log('Login Response:', loginRes.status, loginRes.body);
  const cookie = loginRes.headers['set-cookie']?.[0];
  console.log('Set-Cookie Header:', cookie);

  console.log("\n=== Testing Authenticated /auth/me ===");
  const meRes = await request('GET', '/auth/me', null, cookie);
  console.log('/auth/me Response:', meRes.status, meRes.body);

  console.log("\n=== Testing Logout ===");
  const logoutRes = await request('POST', '/auth/logout', null, cookie);
  console.log('Logout Response:', logoutRes.status, logoutRes.body);
  
  console.log("\n=== Testing /auth/me after logout ===");
  const meAfterRes = await request('GET', '/auth/me');
  console.log('/auth/me After Logout:', meAfterRes.status, meAfterRes.body);
}

run().catch(console.error);
