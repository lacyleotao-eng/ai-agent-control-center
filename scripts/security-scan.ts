import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", "node_modules", ".next", "coverage", ".data", "tmp"]);
const textExtensions = new Set([
  ".md",
  ".ts",
  ".tsx",
  ".mjs",
  ".json",
  ".yml",
  ".yaml",
  ".css",
  ".sql",
  ".prisma",
  ".toml",
  ".txt",
]);

const forbiddenAbsolutePath = ["/Users", "lee"].join("/") + "/";
const forbiddenProjectNames = [
  ["Life", "OS"].join(""),
  ["Home", "OS"].join(""),
  ["Sho", "pee"].join(""),
  ["Stock", "OS"].join(""),
];

const checks: Array<[string, RegExp]> = [
  ["credential-like assignment", /(?:api[_-]?key|access[_-]?token|password|cookie|secret)\s*[:=]\s*["'][^"'\n]{8,}["']/i],
  ["known token prefix", /(?:sk-[A-Za-z0-9]|gh[pousr]_[A-Za-z0-9]|xox[baprs]-[A-Za-z0-9]|Bearer\s+[A-Za-z0-9])/],
  ["email address", /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/],
  ["phone-like number", /(?:\+?\d[\d ()-]{8,}\d)/],
];

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(absolute)));
    else if (textExtensions.has(entry.name.slice(entry.name.lastIndexOf(".")))) files.push(absolute);
  }
  return files;
}

async function main() {
  const findings: string[] = [];
  for (const file of await filesUnder(root)) {
    const content = await readFile(file, "utf8");
    const relativeFile = relative(root, file);
    if (content.includes(forbiddenAbsolutePath)) findings.push(`${relativeFile}: local absolute path`);
    for (const name of forbiddenProjectNames) {
      if (content.includes(name)) findings.push(`${relativeFile}: private project marker`);
    }
    for (const [label, pattern] of checks) {
      if (label === "phone-like number" && relativeFile === "pnpm-lock.yaml") continue;
      const scanContent = label === "phone-like number"
        ? content
            .replace(/\b\d{4}-\d{2}-\d{2}\b/g, "")
            .replace(/\bv?\d+\.\d+\.\d+(?:-[A-Za-z0-9.]+)?\b/g, "")
        : content;
      if (pattern.test(scanContent)) findings.push(`${relativeFile}: ${label}`);
    }
  }

  if (findings.length > 0) {
    console.error("Security scan failed:");
    for (const finding of findings) console.error(`- ${finding}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Security scan passed: ${await filesUnder(root).then((files) => files.length)} text files checked.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
