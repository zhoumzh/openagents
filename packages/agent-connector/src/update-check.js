'use strict';

const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const VERSION_URL = 'https://gitlab.chehejia.com/api/v4/projects/zhoumingzhu%2Fli-openagents/packages/generic/openagents/latest/version.json';
const CORE_URL = 'https://gitlab.chehejia.com/api/v4/projects/zhoumingzhu%2Fli-openagents/packages/generic/openagents/latest/agent-launcher-latest.tgz';

const INTERNAL_VERSION_FILE = path.join(os.homedir(), '.openagents', 'internal_version.json');
const CORE_DIR = path.join(os.homedir(), '.openagents', 'nodejs', 'node_modules', '@openagents-org', 'agent-launcher');

function fetchJson(url, timeoutMs = 2500) {
  return new Promise((resolve) => {
    https.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    }).on('error', () => resolve(null)).on('timeout', () => resolve(null));
  });
}

function currentVersion() {
  try {
    return JSON.parse(fs.readFileSync(INTERNAL_VERSION_FILE, 'utf-8')).core || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function checkForUpdate() {
  const remote = await fetchJson(VERSION_URL);
  if (!remote || !remote.core) return null;

  let local = {};
  try { local = JSON.parse(fs.readFileSync(INTERNAL_VERSION_FILE, 'utf-8')); } catch {}

  const isNewer = remote.core !== local.core;
  return { current: local.core || 'unknown', latest: remote.core, isNewer, remoteData: remote };
}

function runUpdate(remoteData) {
  process.stderr.write(`[launcher] Downloading core update...\n`);
  const tmpTgz = path.join(os.tmpdir(), `oa_core_update_${Date.now()}.tgz`);
  
  return new Promise((resolve) => {
    const file = fs.createWriteStream(tmpTgz);
    https.get(CORE_URL, (res) => {
      if (res.statusCode !== 200) {
        process.stderr.write(`[launcher] Failed to download core: HTTP ${res.statusCode}\n`);
        file.close();
        resolve(false);
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        try {
          fs.mkdirSync(CORE_DIR, { recursive: true });
          execSync(`tar -xzf "${tmpTgz}" -C "${CORE_DIR}" --strip-components=1`, { stdio: 'ignore' });
          
          // Update local version file
          let local = {};
          try { local = JSON.parse(fs.readFileSync(INTERNAL_VERSION_FILE, 'utf-8')); } catch {}
          if (remoteData && remoteData.core) {
            local.core = remoteData.core;
          }
          if (remoteData && remoteData.launcher && !local.launcher) {
            local.launcher = remoteData.launcher;
          }
          fs.mkdirSync(path.dirname(INTERNAL_VERSION_FILE), { recursive: true });
          fs.writeFileSync(INTERNAL_VERSION_FILE, JSON.stringify(local, null, 2));
          
          try { fs.unlinkSync(tmpTgz); } catch {}
          resolve(true);
        } catch (e) {
          process.stderr.write(`[launcher] Failed to extract core: ${e.message}\n`);
          try { fs.unlinkSync(tmpTgz); } catch {}
          resolve(false);
        }
      });
    }).on('error', () => {
      try { fs.unlinkSync(tmpTgz); } catch {}
      resolve(false);
    });
  });
}

function promptYes(question, timeoutMs = 30000) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) return resolve(false);
    process.stderr.write(question);
    let answered = false;
    const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
    const timer = setTimeout(() => {
      if (answered) return;
      answered = true;
      process.stderr.write('\n');
      rl.close();
      resolve(false);
    }, timeoutMs);
    rl.question('', (ans) => {
      if (answered) return;
      answered = true;
      clearTimeout(timer);
      rl.close();
      const a = (ans || '').trim().toLowerCase();
      resolve(a === '' || a === 'y' || a === 'yes');
    });
  });
}

async function notifyAndMaybeUpdate() {
  let info;
  try { info = await checkForUpdate(); } catch { return; }
  if (!info || !info.isNewer) return;

  process.stderr.write(
    `\n[launcher] Core update available: ${info.current.slice(0,8)} → ${info.latest.slice(0,8)}\n`
  );

  const interactive = process.stdin.isTTY && process.stdout.isTTY;
  if (!interactive) {
    process.stderr.write('[launcher] Run `agn update` to upgrade.\n\n');
    return;
  }

  const accepted = await promptYes('[launcher] Update now? [Y/n] ');
  if (!accepted) {
    process.stderr.write('[launcher] Skipped. Run `agn update` later to upgrade.\n\n');
    return;
  }

  const ok = await runUpdate(info.remoteData);
  if (ok) {
    process.stderr.write(`[launcher] Updated to ${info.latest.slice(0,8)}. Re-run your command.\n`);
    process.exit(0);
  }
  process.stderr.write('[launcher] Update failed — continuing with current version.\n\n');
}

module.exports = {
  checkForUpdate,
  notifyAndMaybeUpdate,
  runUpdate,
  currentVersion,
};
