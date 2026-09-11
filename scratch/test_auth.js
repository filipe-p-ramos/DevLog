const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function simulateLogin(username, password) {
  if (!username || !password) {
    return { success: false, error: "Credenciais inválidas" };
  }

  const user = await prisma.user.findUnique({
    where: { email: username.toLowerCase().trim() },
  });

  if (!user || !user.password) {
    return { success: false, error: "Credenciais inválidas" };
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return { success: false, error: "Credenciais inválidas" };
  }

  return { success: true, userId: user.id };
}

async function runTests() {
  console.log("=== INICIANDO BATERIA DE TESTES DE AUTENTICAÇÃO ===");

  // Teste 1: Filipe com senha correta ("123")
  const t1 = await simulateLogin("filipe", "123");
  console.log("Teste 1 (Filipe + senha correta):", t1.success ? "✅ PASSOU" : "❌ FALHOU", t1);

  // Teste 2: Filipe com case-insensitive ("FiLiPe" + "123")
  const t2 = await simulateLogin("FiLiPe", "123");
  console.log("Teste 2 (Case-insensitive 'FiLiPe'):", t2.success ? "✅ PASSOU" : "❌ FALHOU", t2);

  // Teste 3: Filipe com senha incorreta
  const t3 = await simulateLogin("filipe", "senha_errada_qualquer");
  console.log("Teste 3 (Filipe + senha incorreta):", !t3.success && t3.error === "Credenciais inválidas" ? "✅ PASSOU" : "❌ FALHOU", t3);

  // Teste 4: Usuário deletado Raphael
  const t4 = await simulateLogin("raphael", "123");
  console.log("Teste 4 (Usuário Raphael deletado):", !t4.success && t4.error === "Credenciais inválidas" ? "✅ PASSOU" : "❌ FALHOU", t4);

  // Teste 5: Usuário residual deletado user@projectnotes.local
  const t5 = await simulateLogin("user@projectnotes.local", "123");
  console.log("Teste 5 (Usuário residual deletado):", !t5.success && t5.error === "Credenciais inválidas" ? "✅ PASSOU" : "❌ FALHOU", t5);

  // Teste 6: Campos vazios
  const t6 = await simulateLogin("", "");
  console.log("Teste 6 (Credenciais vazias):", !t6.success && t6.error === "Credenciais inválidas" ? "✅ PASSOU" : "❌ FALHOU", t6);

  console.log("\n=== FIM DOS TESTES ===");
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
