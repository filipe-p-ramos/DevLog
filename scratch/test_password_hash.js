const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "filipe" }
  });
  
  console.log("Email:", user.email);
  console.log("Hash no banco:", user.password);

  const testPasswords = ["123", "filipe", "filipe123", "admin", "123456", "password", ""];
  for (const pwd of testPasswords) {
    const ok = await bcrypt.compare(pwd, user.password);
    if (ok) {
      console.log(`🎉 Senha encontrada! A senha é: "${pwd}"`);
      await prisma.$disconnect();
      return;
    }
  }
  console.log("Nenhuma das senhas comuns conferiu.");
  await prisma.$disconnect();
}

main();
