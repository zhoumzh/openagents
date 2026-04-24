#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const electronPath = require('electron');

// Point to the main Electron entry file
const mainScript = path.join(__dirname, '..', 'src', 'main', 'main.js');

// Pass any additional CLI arguments down to the Electron app
const args = [mainScript].concat(process.argv.slice(2));

// Spawn the Electron process
const proc = spawn(electronPath, args, { stdio: 'inherit' });

proc.on('close', (code) => {
  process.exit(code);
});
