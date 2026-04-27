#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');

const electronPath = require('electron');
const mainScript = path.join(__dirname, '..', 'src', 'main', 'main.js');

const VERSION_URL = 'https://gitlab.chehejia.com/api/v4/projects/zhoumingzhu%2Fli-openagents/packages/generic/openagents/latest/version.json';
const CORE_URL = 'https://gitlab.chehejia.com/api/v4/projects/zhoumingzhu%2Fli-openagents/packages/generic/openagents/latest/agent-launcher-latest.tgz';
const UI_URL = 'https://gitlab.chehejia.com/api/v4/projects/zhoumingzhu%2Fli-openagents/packages/generic/openagents/latest/openagentsui-latest.tgz';

const INTERNAL_VERSION_FILE = path.join(os.homedir(), '.openagents', 'internal_version.json');
const NODEJS_DIR = path.join(os.homedir(), '.openagents', 'nodejs');
const CORE_DIR = path.join(NODEJS_DIR, 'node_modules', '@openagents-org', 'agent-launcher');
const UI_DIR = path.join(__dirname, '..');

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    }).on('error', () => resolve(null)).on('timeout', () => resolve(null));
  });
}

function downloadAndExtract(url, destDir, name) {
  process.stdout.write(`[launcher] Downloading and updating ${name}...\n`);
  const tmpTgz = path.join(os.tmpdir(), `oa_update_${Date.now()}.tgz`);
  return new Promise((resolve) => {
    const file = fs.createWriteStream(tmpTgz);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        process.stderr.write(`[launcher] Failed to download ${name}: HTTP ${res.statusCode}\n`);
        file.close();
        resolve();
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        try {
          fs.mkdirSync(destDir, { recursive: true });
          execSync(`tar -xzf "${tmpTgz}" -C "${destDir}" --strip-components=1`, { stdio: 'ignore' });
        } catch (e) {
          process.stderr.write(`[launcher] Failed to extract ${name}: ${e.message}\n`);
        }
        try { fs.unlinkSync(tmpTgz); } catch {}
        resolve();
      });
    }).on('error', () => {
      try { fs.unlinkSync(tmpTgz); } catch {}
      resolve();
    });
  });
}

async function checkAndUpdate() {
  const remote = await fetchJson(VERSION_URL);
  if (!remote || (!remote.core && !remote.launcher)) return;

  let local = {};
  try { local = JSON.parse(fs.readFileSync(INTERNAL_VERSION_FILE, 'utf-8')); } catch {}

  let updated = false;

  if (remote.core && remote.core !== local.core) {
    await downloadAndExtract(CORE_URL, CORE_DIR, 'Core Services');
    local.core = remote.core;
    updated = true;
  }

  if (remote.launcher && remote.launcher !== local.launcher) {
    await downloadAndExtract(UI_URL, UI_DIR, 'Launcher UI');
    local.launcher = remote.launcher;
    updated = true;
  }

  if (updated) {
    try {
      fs.mkdirSync(path.dirname(INTERNAL_VERSION_FILE), { recursive: true });
      fs.writeFileSync(INTERNAL_VERSION_FILE, JSON.stringify(local, null, 2));
    } catch {}
    process.stdout.write(`[launcher] Updates applied successfully.\n`);
  }
}

async function main() {
  // Check for updates first
  await checkAndUpdate();

  // Spawn the Electron process
  const args = [mainScript].concat(process.argv.slice(2));
  const proc = spawn(electronPath, args, { stdio: 'inherit' });

  proc.on('close', (code) => {
    process.exit(code);
  });
}

main();
