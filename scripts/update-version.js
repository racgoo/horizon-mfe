import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function updateVersion(version) {
  if (!version) {
    console.error('Usage: node update-version.js <version>');
    console.error('Example: node update-version.js 0.2.0');
    process.exit(1);
  }

  // Update package.json
  const packageJsonPath = join(rootDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const oldVersion = packageJson.version;
  packageJson.version = version;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✓ Updated version from ${oldVersion} to ${version} in package.json`);

  // Update README.md (English) — match "**Version:** " plus any value (e.g. "--" or "0.0.1")
  const readmePath = join(rootDir, 'README.md');
  let readmeContent = fs.readFileSync(readmePath, 'utf-8');
  readmeContent = readmeContent.replace(
    /\*\*Version:\*\* [^\n]+/,
    `**Version:** ${version}`
  );
  readmeContent = readmeContent.replace(
    new RegExp(`\\b${oldVersion.replace(/\./g, '\\.')}\\b`, 'g'),
    version
  );
  readmeContent = readmeContent.replace(
    /https:\/\/img\.shields\.io\/npm\/v\/[^)\s]+/g,
    'https://img.shields.io/npm/v/horizon-mfe'
  );
  readmeContent = readmeContent.replace(
    /https:\/\/www\.npmjs\.com\/package\/[^)\s]+/g,
    (m) => m.replace(/\/package\/[^)\s]+$/, '/package/horizon-mfe')
  );
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`✓ Updated version in README.md`);

  const readmesDir = join(rootDir, 'READMES');

  // Update READMES/README.ko.md (Korean) — same "**Version:**" line as README.md
  const readmeKoPath = join(readmesDir, 'README.ko.md');
  if (fs.existsSync(readmeKoPath)) {
    let readmeKoContent = fs.readFileSync(readmeKoPath, 'utf-8');
    readmeKoContent = readmeKoContent.replace(
      /\*\*Version:\*\* [^\n]+/,
      `**Version:** ${version}`
    );
    readmeKoContent = readmeKoContent.replace(
      new RegExp(`\\b${oldVersion.replace(/\./g, '\\.')}\\b`, 'g'),
      version
    );
    readmeKoContent = readmeKoContent.replace(
      /https:\/\/img\.shields\.io\/npm\/v\/[^)\s]+/g,
      'https://img.shields.io/npm/v/horizon-mfe'
    );
    readmeKoContent = readmeKoContent.replace(
      /https:\/\/www\.npmjs\.com\/package\/[^)\s]+/g,
      (m) => m.replace(/\/package\/[^)\s]+$/, '/package/horizon-mfe')
    );
    fs.writeFileSync(readmeKoPath, readmeKoContent);
    console.log(`✓ Updated version in READMES/README.ko.md`);
  }

  // Update READMES/README.zh.md (Simplified Chinese) — same "**Version:**" line
  const readmeZhPath = join(readmesDir, 'README.zh.md');
  if (fs.existsSync(readmeZhPath)) {
    let readmeZhContent = fs.readFileSync(readmeZhPath, 'utf-8');
    readmeZhContent = readmeZhContent.replace(
      /\*\*Version:\*\* [^\n]+/,
      `**Version:** ${version}`
    );
    readmeZhContent = readmeZhContent.replace(
      new RegExp(`\\b${oldVersion.replace(/\./g, '\\.')}\\b`, 'g'),
      version
    );
    readmeZhContent = readmeZhContent.replace(
      /https:\/\/img\.shields\.io\/npm\/v\/[^)\s]+/g,
      'https://img.shields.io/npm/v/horizon-mfe'
    );
    readmeZhContent = readmeZhContent.replace(
      /https:\/\/www\.npmjs\.com\/package\/[^)\s]+/g,
      (m) => m.replace(/\/package\/[^)\s]+$/, '/package/horizon-mfe')
    );
    fs.writeFileSync(readmeZhPath, readmeZhContent);
    console.log(`✓ Updated version in READMES/README.zh.md`);
  }

  // Update READMES/README.ja.md (Japanese) — same "**Version:**" line
  const readmeJaPath = join(readmesDir, 'README.ja.md');
  if (fs.existsSync(readmeJaPath)) {
    let readmeJaContent = fs.readFileSync(readmeJaPath, 'utf-8');
    readmeJaContent = readmeJaContent.replace(
      /\*\*Version:\*\* [^\n]+/,
      `**Version:** ${version}`
    );
    readmeJaContent = readmeJaContent.replace(
      new RegExp(`\\b${oldVersion.replace(/\./g, '\\.')}\\b`, 'g'),
      version
    );
    readmeJaContent = readmeJaContent.replace(
      /https:\/\/img\.shields\.io\/npm\/v\/[^)\s]+/g,
      'https://img.shields.io/npm/v/horizon-mfe'
    );
    readmeJaContent = readmeJaContent.replace(
      /https:\/\/www\.npmjs\.com\/package\/[^)\s]+/g,
      (m) => m.replace(/\/package\/[^)\s]+$/, '/package/horizon-mfe')
    );
    fs.writeFileSync(readmeJaPath, readmeJaContent);
    console.log(`✓ Updated version in READMES/README.ja.md`);
  }

  // Update READMES/README.sp.md (Spanish) — same "**Version:**" line
  const readmeSpPath = join(readmesDir, 'README.sp.md');
  if (fs.existsSync(readmeSpPath)) {
    let readmeSpContent = fs.readFileSync(readmeSpPath, 'utf-8');
    readmeSpContent = readmeSpContent.replace(
      /\*\*Version:\*\* [^\n]+/,
      `**Version:** ${version}`
    );
    readmeSpContent = readmeSpContent.replace(
      new RegExp(`\\b${oldVersion.replace(/\./g, '\\.')}\\b`, 'g'),
      version
    );
    readmeSpContent = readmeSpContent.replace(
      /https:\/\/img\.shields\.io\/npm\/v\/[^)\s]+/g,
      'https://img.shields.io/npm/v/horizon-mfe'
    );
    readmeSpContent = readmeSpContent.replace(
      /https:\/\/www\.npmjs\.com\/package\/[^)\s]+/g,
      (m) => m.replace(/\/package\/[^)\s]+$/, '/package/horizon-mfe')
    );
    fs.writeFileSync(readmeSpPath, readmeSpContent);
    console.log(`✓ Updated version in READMES/README.sp.md`);
  }

  // Update READMES/README.fr.md (French) — same "**Version:**" line
  const readmeFrPath = join(readmesDir, 'README.fr.md');
  if (fs.existsSync(readmeFrPath)) {
    let readmeFrContent = fs.readFileSync(readmeFrPath, 'utf-8');
    readmeFrContent = readmeFrContent.replace(
      /\*\*Version:\*\* [^\n]+/,
      `**Version:** ${version}`
    );
    readmeFrContent = readmeFrContent.replace(
      new RegExp(`\\b${oldVersion.replace(/\./g, '\\.')}\\b`, 'g'),
      version
    );
    readmeFrContent = readmeFrContent.replace(
      /https:\/\/img\.shields\.io\/npm\/v\/[^)\s]+/g,
      'https://img.shields.io/npm/v/horizon-mfe'
    );
    readmeFrContent = readmeFrContent.replace(
      /https:\/\/www\.npmjs\.com\/package\/[^)\s]+/g,
      (m) => m.replace(/\/package\/[^)\s]+$/, '/package/horizon-mfe')
    );
    fs.writeFileSync(readmeFrPath, readmeFrContent);
    console.log(`✓ Updated version in READMES/README.fr.md`);
  }

  // Update READMES/README.hi.md (Hindi) — same "**Version:**" line
  const readmeHiPath = join(readmesDir, 'README.hi.md');
  if (fs.existsSync(readmeHiPath)) {
    let readmeHiContent = fs.readFileSync(readmeHiPath, 'utf-8');
    readmeHiContent = readmeHiContent.replace(
      /\*\*Version:\*\* [^\n]+/,
      `**Version:** ${version}`
    );
    readmeHiContent = readmeHiContent.replace(
      new RegExp(`\\b${oldVersion.replace(/\./g, '\\.')}\\b`, 'g'),
      version
    );
    readmeHiContent = readmeHiContent.replace(
      /https:\/\/img\.shields\.io\/npm\/v\/[^)\s]+/g,
      'https://img.shields.io/npm/v/horizon-mfe'
    );
    readmeHiContent = readmeHiContent.replace(
      /https:\/\/www\.npmjs\.com\/package\/[^)\s]+/g,
      (m) => m.replace(/\/package\/[^)\s]+$/, '/package/horizon-mfe')
    );
    fs.writeFileSync(readmeHiPath, readmeHiContent);
    console.log(`✓ Updated version in READMES/README.hi.md`);
  }

  // Update READMES/README.ru.md (Russian) — same "**Version:**" line
  const readmeRuPath = join(readmesDir, 'README.ru.md');
  if (fs.existsSync(readmeRuPath)) {
    let readmeRuContent = fs.readFileSync(readmeRuPath, 'utf-8');
    readmeRuContent = readmeRuContent.replace(
      /\*\*Version:\*\* [^\n]+/,
      `**Version:** ${version}`
    );
    readmeRuContent = readmeRuContent.replace(
      new RegExp(`\\b${oldVersion.replace(/\./g, '\\.')}\\b`, 'g'),
      version
    );
    readmeRuContent = readmeRuContent.replace(
      /https:\/\/img\.shields\.io\/npm\/v\/[^)\s]+/g,
      'https://img.shields.io/npm/v/horizon-mfe'
    );
    readmeRuContent = readmeRuContent.replace(
      /https:\/\/www\.npmjs\.com\/package\/[^)\s]+/g,
      (m) => m.replace(/\/package\/[^)\s]+$/, '/package/horizon-mfe')
    );
    fs.writeFileSync(readmeRuPath, readmeRuContent);
    console.log(`✓ Updated version in READMES/README.ru.md`);
  }

  // Update READMES/README.arc.md (Arabic) — same "**Version:**" line
  const readmeArcPath = join(readmesDir, 'README.arc.md');
  if (fs.existsSync(readmeArcPath)) {
    let readmeArcContent = fs.readFileSync(readmeArcPath, 'utf-8');
    readmeArcContent = readmeArcContent.replace(
      /\*\*Version:\*\* [^\n]+/,
      `**Version:** ${version}`
    );
    readmeArcContent = readmeArcContent.replace(
      new RegExp(`\\b${oldVersion.replace(/\./g, '\\.')}\\b`, 'g'),
      version
    );
    readmeArcContent = readmeArcContent.replace(
      /https:\/\/img\.shields\.io\/npm\/v\/[^)\s]+/g,
      'https://img.shields.io/npm/v/horizon-mfe'
    );
    readmeArcContent = readmeArcContent.replace(
      /https:\/\/www\.npmjs\.com\/package\/[^)\s]+/g,
      (m) => m.replace(/\/package\/[^)\s]+$/, '/package/horizon-mfe')
    );
    fs.writeFileSync(readmeArcPath, readmeArcContent);
    console.log(`✓ Updated version in READMES/README.arc.md`);
  }
}

// Get version from command line arguments
const version = process.argv[2];
updateVersion(version);
