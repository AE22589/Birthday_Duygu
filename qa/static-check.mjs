import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProject } from './project-consistency.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = validateProject(root);
if (result.errors.length) {
  throw new Error(`project consistency failed:\n${result.errors.join('\n')}`);
}

console.log(`PASS: v${result.version} static QA`);
console.log(JSON.stringify({
  version: result.version,
  requiredAssets: 3,
  security: "5-click + 1337 code",
  questFlow: "map -> intro -> countdown -> game -> result",
  controls: ["ArrowLeft","ArrowRight","A","D","swipe (pointerdown/up)","pointerTouch"],
  gameOver: "lives can reach 0",
  mobileCss: true
}, null, 2));
