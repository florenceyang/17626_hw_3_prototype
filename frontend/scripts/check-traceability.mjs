#!/usr/bin/env node
// T059 (Constitution Principles I and II): every acceptance scenario (US#-AS#), functional requirement
// (FR-###) and success criterion (SC-###) in the spec must be cited by at least one test title.
// SC-001 and SC-008 are usability checks run by hand (quickstart.md), so they are exempt.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const frontend = resolve(here, "..");
const specPath = resolve(frontend, "../specs/001-legal-aid-intake-form/spec.md");
const MANUAL = new Set(["SC-001", "SC-008"]);

// ---- IDs from the spec
const spec = readFileSync(specPath, "utf8");
const ids = [];
let story = null;
for (const line of spec.split("\n")) {
  const s = line.match(/^### User Story (\d+)/);
  if (s) story = s[1];
  else if (/^##? /.test(line) && !line.startsWith("### ")) story = null;
  const a = story && line.match(/^(\d+)\. \*\*Given\*\*/);
  if (a) ids.push(`US${story}-AS${a[1]}`);
}
for (const m of spec.matchAll(/\*\*(FR-\d{3}|SC-\d{3})\*\*:/g)) ids.push(m[1]);

// ---- Test titles
function run(cmd, args) {
  return execFileSync(cmd, args, { cwd: frontend, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32e6 });
}
const titles = [];
const vitest = JSON.parse(run("npx", ["vitest", "list", "--json"]));
for (const t of vitest) titles.push(t.name);

const pw = JSON.parse(run("npx", ["playwright", "test", "--list", "--reporter=json"]));
(function walk(suites) {
  for (const s of suites ?? []) {
    for (const spec of s.specs ?? []) titles.push(spec.title);
    walk(s.suites);
  }
})(pw.suites);

// ---- Compare
const covered = (id) => titles.some((t) => new RegExp(`(^|[^\\w-])${id}(?![\\w])`).test(t));
const missing = ids.filter((id) => !MANUAL.has(id) && !covered(id));

console.log(`Spec IDs: ${ids.length} (${MANUAL.size} manual: ${[...MANUAL].join(", ")})`);
console.log(`Test titles: ${titles.length}`);
if (missing.length) {
  console.error(`\nNot cited by any test (${missing.length}):`);
  for (const id of missing) console.error(`  - ${id}`);
  process.exit(1);
}
console.log("\nEvery scenario, requirement, and automated success criterion is cited by at least one test.");
