const http = require('http');

function makeRequest(path, cookie = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Cookie': cookie,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function run() {
  const filipeId = "2c55741f-6cb1-4aa0-855e-e76a43d802a5";
  console.log('--- TESTANDO GET / com usuário filipe autenticado ---');
  try {
    const res = await makeRequest('/', `auth_token=${filipeId}`);
    console.log('Status code /:', res.statusCode);
    console.log('Body snippet:', res.body.substring(0, 300));
  } catch (err) {
    console.error('Falha:', err.message);
  }
}

run();
