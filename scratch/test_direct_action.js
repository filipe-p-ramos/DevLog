const { loginWithPassword } = require('../src/app/actions/auth');

async function test() {
  try {
    const formData = new FormData();
    formData.append('username', 'filipe');
    formData.append('password', '123');
    const res = await loginWithPassword(formData);
    console.log('Resultado:', res);
  } catch (err) {
    console.error('Erro capturado:', err);
  }
}

test();
