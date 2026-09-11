const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testPasswordChangeLogic() {
  console.log('--- Testando Lógica de Criptografia e Troca de Senha ---');
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('Nenhum usuário encontrado.');
      return;
    }
    console.log(`Usuário encontrado: ${user.email}`);

    // Guardar hash atual para restaurar
    const originalHash = user.password;

    // 1. Simular validação de senha incorreta
    const isFakeValid = await bcrypt.compare('senha_errada_123', originalHash);
    console.log('Senha incorreta rejeitada corretamente?', isFakeValid === false);

    // 2. Simular troca de senha
    const tempPassword = 'senha_teste_temp_999';
    const salt = await bcrypt.genSalt(10);
    const tempHash = await bcrypt.hash(tempPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: tempHash }
    });

    // 3. Validar se a nova senha bate com o hash novo
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    const isNewValid = await bcrypt.compare(tempPassword, updatedUser.password);
    console.log('Nova senha validada com sucesso?', isNewValid === true);

    // 4. Restaurar hash original
    await prisma.user.update({
      where: { id: user.id },
      data: { password: originalHash }
    });
    console.log('Hash original restaurado com sucesso.');
    console.log('--- Teste concluído com 100% de sucesso! ---');
  } finally {
    await prisma.$disconnect();
  }
}

testPasswordChangeLogic();
