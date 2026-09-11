const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const username = args[0]?.trim();
  const rawPassword = args[1]?.trim();

  if (!username || !rawPassword) {
    console.log(`
Uso do script:
  node scripts/set-password.js <usuario> <nova_senha>

Exemplo:
  node scripts/set-password.js filipe 123
    `);
    process.exit(1);
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

  const existingUser = await prisma.user.findUnique({
    where: { email: username.toLowerCase() }
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { password: passwordHash }
    });
    console.log(`✅ Senha atualizada com sucesso para o usuário '${username}' com hash bcrypt.`);
  } else {
    const newUser = await prisma.user.create({
      data: {
        email: username.toLowerCase(),
        password: passwordHash
      }
    });
    console.log(`✅ Novo usuário '${username}' criado com sucesso (ID: ${newUser.id}) e senha definida.`);
  }
}

main()
  .catch((err) => {
    console.error("❌ Erro ao definir senha:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
