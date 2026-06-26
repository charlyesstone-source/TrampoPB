// Aplica um arquivo .sql no Postgres do Supabase.
// Conexão vem de variáveis de ambiente PG* (PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT)
// — nenhum segredo é gravado em arquivo.
//
// Uso: node scripts/apply-sql.mjs <caminho-do-arquivo.sql>
import { Client } from "pg";
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Informe o caminho do .sql");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const client = new Client({ ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log(`OK: ${file} aplicado com sucesso.`);
} catch (err) {
  console.error("FALHA ao aplicar:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
