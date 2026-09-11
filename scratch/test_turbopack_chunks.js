const http = require('http');

http.get({
  hostname: 'localhost',
  port: 3000,
  path: '/',
  headers: { 'Cookie': 'auth_token=2c55741f-6cb1-4aa0-855e-e76a43d802a5' }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const scripts = [...data.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
    console.log('Script sources:', scripts);
    
    // Test fetching each script
    Promise.all(scripts.map(src => {
      return new Promise((resolve) => {
        http.get('http://localhost:3000' + src, scriptRes => {
          console.log(`Script ${src}: status ${scriptRes.statusCode}`);
          resolve();
        });
      });
    })).then(() => {
      console.log('All scripts verified.');
    });
  });
});
