// Met à jour docs/qpi)docsV4.json depuis le Swagger/OpenAPI exposé par le backend.
//
// Usage :
//   node scripts/update-api-docs.mjs
//   node scripts/update-api-docs.mjs --url http://localhost:8080/v3/api-docs
//   npm run docs:update
//
// Par défaut, interroge http://localhost:8080/api-docs. Écrase toujours
// docs/qpi)docsV4.json (le spec "live" utilisé par le frontend) après avoir
// vérifié que le JSON reçu est valide. L'ancien contenu est sauvegardé à
// côté en cas de souci (voir BACKUP_PATH).

import { writeFileSync, existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_URL = "http://localhost:8080/api-docs";
const TARGET_PATH = path.resolve(__dirname, "../docs/api-docsV4.json");
const BACKUP_PATH = path.resolve(__dirname, "../docs/api-docsV4.backup.json");

function getArgUrl() {
  const idx = process.argv.indexOf("--url");
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return process.env.API_DOCS_URL || DEFAULT_URL;
}

async function main() {
  const url = getArgUrl();
  console.log(`→ Récupération du spec OpenAPI depuis ${url} ...`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Échec HTTP ${res.status} ${res.statusText} en interrogeant ${url}`);
  }

  const text = await res.text();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("La réponse n'est pas un JSON valide — vérifie l'URL (backend démarré ? bon port ?).");
  }

  if (!parsed.openapi && !parsed.swagger) {
    throw new Error("La réponse ne ressemble pas à un document OpenAPI/Swagger (champ 'openapi' ou 'swagger' absent).");
  }

  // Sauvegarde de l'ancien spec avant écrasement, pour pouvoir comparer/rollback.
  if (existsSync(TARGET_PATH)) {
    copyFileSync(TARGET_PATH, BACKUP_PATH);
    console.log(`  ancien spec sauvegardé → ${path.relative(process.cwd(), BACKUP_PATH)}`);
  }

  const pretty = JSON.stringify(parsed, null, 2) + "\n";
  writeFileSync(TARGET_PATH, pretty, "utf-8");

  const nbPaths = Object.keys(parsed.paths ?? {}).length;
  console.log(`✔ Spec mis à jour → ${path.relative(process.cwd(), TARGET_PATH)} (${nbPaths} routes, ${pretty.length} octets)`);
}

main().catch((err) => {
  console.error(`✖ ${err.message}`);
  process.exit(1);
});
