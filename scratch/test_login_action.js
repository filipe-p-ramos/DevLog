const http = require('http');

async function testLoginPost() {
  console.log("Testando POST de login para http://localhost:3000/login...");
  
  // No Next.js Server Actions, podemos chamar via POST com cabeçalho Next-Action ou multipart
  // Mas primeiro vamos ver se o banco e bcrypt conseguem autenticar filipe diretamente:
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const prisma = new PrismaClient();
  
  const user = await prisma.user.findUnique({
    where: { email: "filipe" }
  });
  console.log("Usuário encontrado:", user ? user.email : "não encontrado");
  if (user) {
    const valid = await bcrypt.compare("123", user.password);
    console.log("Senha '123' confere com hash?", valid);
  }
  await prisma.$disconnect();
}

testLoginPost();
