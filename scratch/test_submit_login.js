const http = require('http');

async function testSubmitLogin() {
  // Primeiro, fazemos um GET em /login para pegar o form e a action ID se houver
  const getReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/login',
    method: 'GET',
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('GET /login status:', res.statusCode);
      // Procurar action id
      const match = body.match(/name="\$ACTION_ID_([^"]+)"/);
      console.log('Action ID match:', match ? match[0] : 'Não encontrado');
      
      // Vamos tentar fazer o POST simulando formulário simples
      const boundary = '----WebKitFormBoundaryABC123';
      let postData = '';
      postData += `--${boundary}\r\n`;
      postData += `Content-Disposition: form-data; name="username"\r\n\r\n`;
      postData += `filipe\r\n`;
      postData += `--${boundary}\r\n`;
      postData += `Content-Disposition: form-data; name="password"\r\n\r\n`;
      postData += `123\r\n`;
      postData += `--${boundary}--\r\n`;

      const postReq = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/login',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(postData),
        }
      }, (postRes) => {
        let postBody = '';
        postRes.on('data', c => postBody += c);
        postRes.on('end', () => {
          console.log('POST /login status:', postRes.statusCode);
          console.log('POST /login headers:', postRes.headers);
          console.log('POST /login body snippet:', postBody.substring(0, 500));
        });
      });

      postReq.on('error', e => console.error('Erro POST:', e));
      postReq.write(postData);
      postReq.end();
    });
  });

  getReq.on('error', e => console.error('Erro GET:', e));
  getReq.end();
}

testSubmitLogin();
