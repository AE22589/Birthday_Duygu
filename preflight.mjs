import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { validateProject } from './project-consistency.mjs';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const result = validateProject(root);
if (result.errors.length) throw new Error(`PREFLIGHT: project consistency failed:\n${result.errors.join('\n')}`);

for (const f of ['script.js','roadtrip.js','game-logic.js','qa/static-check.mjs','qa/project-consistency.mjs','tests/e2e/roadtrip-behavior.spec.js']) {
  execFileSync('node',['--check',path.join(root,f)],{stdio:'pipe'});
}
console.log(`PREFLIGHT PASS: v${result.version}`);
console.log('project consistency: PASS');
console.log('JavaScript syntax: PASS');
console.log('required assets/files: PASS');
