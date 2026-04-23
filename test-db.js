const { PrismaClient } = require('@prisma/client');

async function testConnection(url, name) {
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient();
  console.log(`\nTestando ${name}...`);
  try {
    await prisma.$connect();
    console.log(`✅ Sucesso em ${name}!`);
    return true;
  } catch (e) {
    console.error(`❌ Falha em ${name}:`, e.message.split('\n')[0]);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const pwd = "Cs3wxhVFHeYj2DMi";
  const ref = "zfgsyaxhqydicqyxcksw";
  
  const urls = [
    { name: "Direct IPv6 (db...)", url: `postgresql://postgres:${pwd}@db.${ref}.supabase.co:5432/postgres` },
    { name: "Pooler AWS 5432 (postgres.ref)", url: `postgresql://postgres.${ref}:${pwd}@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true` },
    { name: "Pooler AWS 6543 (postgres.ref)", url: `postgresql://postgres.${ref}:${pwd}@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true` },
    { name: "Pooler AWS 5432 (postgres)", url: `postgresql://postgres:${pwd}@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true` },
    { name: "Pooler Global 5432", url: `postgresql://postgres.${ref}:${pwd}@pooler.supabase.com:5432/postgres?pgbouncer=true` }
  ];

  for (const {name, url} of urls) {
    const ok = await testConnection(url, name);
    if (ok) {
      console.log(`\n🎉 CONEXÃO VENCEDORA: ${name}`);
      console.log(`URL: ${url}`);
      return;
    }
  }
  console.log("\nNenhuma conexão funcionou. :(");
}

main();
