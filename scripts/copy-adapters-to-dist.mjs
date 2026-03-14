import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(new URL("..", import.meta.url).pathname);
const distDir = path.join(rootDir, "dist");

const adapters = [
  { name: "react", pkg: "adapter-react" },
  { name: "vue", pkg: "adapter-vue" },
  { name: "solid", pkg: "adapter-solid" },
  { name: "svelte", pkg: "adapter-svelte" },
  { name: "ember", pkg: "adapter-ember" },
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

ensureDir(distDir);

for (const { name, pkg } of adapters) {
  const srcBase = path.join(rootDir, "packages", pkg, "dist");
  const outBase = path.join(distDir, name);

  const jsFile = path.join(srcBase, `adapter-${name}.js`);
  const jsMapFile = path.join(srcBase, `adapter-${name}.js.map`);
  const umdFile = path.join(srcBase, `adapter-${name}.umd.js`);
  const umdMapFile = path.join(srcBase, `adapter-${name}.umd.js.map`);
  const dtsFile = path.join(srcBase, "index.d.ts");

  copyIfExists(jsFile, path.join(outBase, `adapter-${name}.js`));
  copyIfExists(jsMapFile, path.join(outBase, `adapter-${name}.js.map`));
  copyIfExists(umdFile, path.join(outBase, `adapter-${name}.umd.js`));
  copyIfExists(umdMapFile, path.join(outBase, `adapter-${name}.umd.js.map`));
  copyIfExists(dtsFile, path.join(outBase, "index.d.ts"));
}

