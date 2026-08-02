import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function run(args, input) {
  const result = spawnSync(pnpm, args, {
    cwd: root,
    env: process.env,
    encoding: "utf8",
    input,
    stdio: [input ? "pipe" : "inherit", "inherit", "inherit"],
  });
  return result.status ?? 1;
}

if (run(["exec", "prisma", "generate", "--schema", "prisma/schema.prisma"]) !== 0) {
  process.exit(1);
}

const migrationStatus = run(["exec", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"]);
if (migrationStatus !== 0) {
  console.warn("Prisma migrate deploy was unavailable; applying the checked-in SQLite migration through prisma db execute.");
  const migration = await readFile(join(root, "prisma/migrations/0001_init/migration.sql"), "utf8");
  if (run(["exec", "prisma", "db", "execute", "--schema", "prisma/schema.prisma", "--stdin"], migration) !== 0) {
    process.exit(1);
  }
}

if (run(["exec", "prisma", "db", "seed"]) !== 0) {
  process.exit(1);
}

console.log("Database setup complete: migration and Demo Project seed are ready.");
