#!/usr/bin/env node
/// <reference types="node" />

import fs from "fs";
import http from "http";
import path from "path";
import readline from "readline";
import { createStore } from "../index.js";

// Colors and Styling Tokens
const PURPLE = "\x1b[38;5;99m";
const CYAN = "\x1b[38;5;51m";
const GREEN = "\x1b[38;5;82m";
const RED = "\x1b[38;5;196m";
const GREY = "\x1b[38;5;244m";
const DARK_GREY = "\x1b[38;5;238m";
const WHITE = "\x1b[1m\x1b[37m";
const MAGENTA = "\x1b[38;5;207m";
const GOLD = "\x1b[38;5;214m";
const RESET = "\x1b[0m";

// Prints a gorgeous ASCII Logo
function printBanner() {
  console.clear();
  console.log(`${PURPLE}┌────────────────────────────────────────────────────────┐${RESET}`);
  console.log(`${PURPLE}│${WHITE}    ______ _                                _            ${PURPLE}│${RESET}`);
  console.log(`${PURPLE}│${WHITE}   |  ____| |                              | |           ${PURPLE}│${RESET}`);
  console.log(`${PURPLE}│${WHITE}   | |__  | | ___  __ _  __ _ _ __   ___    | |__  _ __   ${PURPLE}│${RESET}`);
  console.log(`${PURPLE}│${WHITE}   |  __| | |/ _ \\/ _\` |/ _\` | '_ \\ / __|   | '_ \\| '_ \\  ${PURPLE}│${RESET}`);
  console.log(`${PURPLE}│${WHITE}   | |____| |  __/ (_| | (_| | | | | (__  _  | |_) | |_) | ${PURPLE}│${RESET}`);
  console.log(`${PURPLE}│${WHITE}   |______|_|\\___|\\__, |\\__,_|_| |_|\\___|(_) |_.__/| .__/  ${PURPLE}│${RESET}`);
  console.log(`${PURPLE}│${WHITE}                   __/ |                           | |     ${PURPLE}│${RESET}`);
  console.log(`${PURPLE}│${WHITE}                  |___/                            |_|     ${PURPLE}│${RESET}`);
  console.log(`${PURPLE}│${CYAN}         ✨ Premium State Management Initializer ✨         ${PURPLE}│${RESET}`);
  console.log(`${PURPLE}└────────────────────────────────────────────────────────┘${RESET}\n`);
}

// Detect the workspace package manager
function detectPackageManager(): "npm" | "pnpm" | "yarn" | "bun" {
  const userAgent = process.env.npm_config_user_agent || "";
  if (userAgent.includes("pnpm")) return "pnpm";
  if (userAgent.includes("yarn")) return "yarn";
  if (userAgent.includes("bun")) return "bun";
  if (userAgent.includes("npm")) return "npm";

  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(dir, "pnpm-lock.yaml"))) return "pnpm";
    if (fs.existsSync(path.join(dir, "yarn.lock"))) return "yarn";
    if (fs.existsSync(path.join(dir, "package-lock.json"))) return "npm";
    if (fs.existsSync(path.join(dir, "bun.lockb")) || fs.existsSync(path.join(dir, "bun.lock"))) return "bun";
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return "npm";
}

// Interactive Keyboard Navigation Menu
async function selectMenu(title: string, options: string[]): Promise<number> {
  let selectedIndex = 0;
  const stdout = process.stdout;

  const render = () => {
    stdout.write("\x1b[?25l"); // Hide cursor
    readline.cursorTo(stdout, 0);
    stdout.write(`   ${WHITE}${title}${RESET}\n\n`);
    
    options.forEach((opt, idx) => {
      if (idx === selectedIndex) {
        stdout.write(`    ${CYAN}➔ ${WHITE}${opt}${RESET}\n`);
      } else {
        stdout.write(`      ${GREY}${opt}${RESET}\n`);
      }
    });
    stdout.write(`\n   ${DARK_GREY}Use ↑/↓ arrows to navigate, Enter to select.${RESET}\n`);
  };

  const clearLines = (count: number) => {
    for (let i = 0; i < count; i++) {
      readline.moveCursor(stdout, 0, -1);
      readline.clearLine(stdout, 0);
    }
  };

  render();

  return new Promise<number>((resolve) => {
    const handleKeypress = (_str: string, key: any) => {
      if (key && key.ctrl && key.name === "c") {
        stdout.write("\x1b[?25h"); // Show cursor
        process.exit(0);
      }

      if (key && key.name === "up") {
        selectedIndex = (selectedIndex - 1 + options.length) % options.length;
        clearLines(options.length + 4);
        render();
      } else if (key && key.name === "down") {
        selectedIndex = (selectedIndex + 1) % options.length;
        clearLines(options.length + 4);
        render();
      } else if (key && key.name === "return") {
        cleanup();
        stdout.write("\x1b[?25h\n"); // Show cursor
        resolve(selectedIndex);
      }
    };

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.on("keypress", handleKeypress);

    const cleanup = () => {
      process.stdin.off("keypress", handleKeypress);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
    };
  });
}

// Generate the fully featured TUI code as a template string
function getTuiTemplate(pkgImport: string): string {
  return `import http from "http";
import readline from "readline";
import { createStore } from "${pkgImport}";

// Colors & Styling Tokens
const PURPLE = "\\x1b[38;5;99m";
const CYAN = "\\x1b[38;5;51m";
const GREEN = "\\x1b[38;5;82m";
const RED = "\\x1b[38;5;196m";
const GREY = "\\x1b[38;5;244m";
const DARK_GREY = "\\x1b[38;5;238m";
const WHITE = "\\x1b[1m\\x1b[37m";
const MAGENTA = "\\x1b[38;5;207m";
const GOLD = "\\x1b[38;5;214m";
const RESET = "\\x1b[0m";

// Initialize Elegant Store
const store = createStore(
  { count: 0 },
  {
    increment: (state) => ({ count: state.count + 1 }),
    decrement: (state) => ({ count: state.count - 1 }),
    reset: () => ({ count: 0 }),
    set: (state, val) => ({ count: val }),
  }
);

const historyLogs = [];
const PORT = 3000;

function logAction(message) {
  const time = new Date().toTimeString().split(" ")[0];
  historyLogs.push(\`[\${time}] \${message}\`);
  if (historyLogs.length > 5) {
    historyLogs.shift();
  }
}

// Render Dashboard
function drawDashboard() {
  const state = store.getState();
  const width = 60;
  const stdout = process.stdout;
  
  stdout.write("\\x1b[2J\\x1b[H"); // Clear screen and home cursor

  let out = "";
  
  // 1. Header
  out += \`\${PURPLE}┌\${"─".repeat(width - 2)}┐\${RESET}\\n\`;
  out += \`\${PURPLE}│\${WHITE}        ✨  ELEGANT STORE - INTERACTIVE LIVE DASHBOARD  ✨        \${PURPLE}│\${RESET}\\n\`;
  out += \`\${PURPLE}└\${"─".repeat(width - 2)}┘\${RESET}\\n\\n\`;

  // 2. Counter Status
  out += \`   \${WHITE}STORE STATE STATUS:\${RESET}\\n\`;
  out += \`   \${GREY}Current Count:\${RESET}  \${GREEN}\${state.count >= 0 ? "▲" : "▼"} \${state.count}\${RESET}\\n\`;
  
  // 3. Progress bar
  const barWidth = 30;
  const maxVal = 20;
  const percentage = Math.min(Math.max((state.count + maxVal) / (maxVal * 2), 0), 1);
  const filled = Math.round(barWidth * percentage);
  const empty = barWidth - filled;
  const bar = \`\${GREEN}\${"█".repeat(filled)}\${DARK_GREY}\${"░".repeat(empty)}\`;
  out += \`   \${GREY}Range [-20,20]:\${RESET} [\${bar}\${RESET}] (\${Math.round(percentage * 100)}%)\\n\\n\`;

  // 4. Remote Execution Server Info
  out += \`   \${WHITE}REMOTE EXECUTION SERVER:\${RESET}\\n\`;
  out += \`   \${GREY}Status:\${RESET}      \${GREEN}● Online\${RESET} on \${CYAN}http://localhost:\${PORT}\${RESET}\\n\`;
  out += \`   \${GREY}API Endpoints (cURL / Browser):\${RESET}\\n\`;
  out += \`     \${MAGENTA}▸ GET /increment\${RESET}  \${DARK_GREY}→  Increments count\${RESET}\\n\`;
  out += \`     \${MAGENTA}▸ GET /decrement\${RESET}  \${DARK_GREY}→  Decrements count\${RESET}\\n\`;
  out += \`     \${MAGENTA}▸ GET /set?val=N \${RESET}  \${DARK_GREY}→  Sets count to N\${RESET}\\n\`;
  out += \`     \${MAGENTA}▸ GET /reset     \${RESET}  \${DARK_GREY}→  Resets count\${RESET}\\n\\n\`;

  // 5. Action History
  out += \`   \${WHITE}LIVE LOGS & ACTION HISTORY:\${RESET}\\n\`;
  if (historyLogs.length === 0) {
    out += \`     \${DARK_GREY}(No actions recorded yet)\${RESET}\\n\`;
  } else {
    historyLogs.forEach(log => {
      out += \`     \${log}\\n\`;
    });
  }
  out += \`\\n\`;

  // 6. Keyboard Footer
  out += \`\${PURPLE}┌\${"─".repeat(width - 2)}┐\${RESET}\\n\`;
  out += \`\${PURPLE}│\${WHITE}  [Space/+] Inc   [-] Dec   [R] Reset   [Q] Quit & Stop Server  \${PURPLE}│\${RESET}\\n\`;
  out += \`\${PURPLE}└\${"─".repeat(width - 2)}┘\${RESET}\\n\`;

  stdout.write(out);
}

// Subscribe dashboard draw to store changes
store.subscribe(drawDashboard);

// Setup HTTP Remote Execution Server
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const parsedUrl = new URL(req.url || "", \`http://localhost:\${PORT}\`);
  const pathname = parsedUrl.pathname;
  const ip = req.socket.remoteAddress || "127.0.0.1";

  if (pathname === "/increment") {
    store.actions.increment();
    logAction(\`Remote [increment] from \${ip}\`);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, count: store.getState().count }));
  } else if (pathname === "/decrement") {
    store.actions.decrement();
    logAction(\`Remote [decrement] from \${ip}\`);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, count: store.getState().count }));
  } else if (pathname === "/reset") {
    store.actions.reset();
    logAction(\`Remote [reset] from \${ip}\`);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, count: store.getState().count }));
  } else if (pathname === "/set") {
    const valStr = parsedUrl.searchParams.get("val");
    const val = parseInt(valStr || "", 10);
    if (!isNaN(val)) {
      store.actions.set(val);
      logAction(\`Remote [set] to \${val} from \${ip}\`);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, count: store.getState().count }));
    } else {
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: "Invalid val parameter" }));
    }
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

server.listen(PORT, () => {
  logAction("Server initialized successfully");
  drawDashboard();
});

// Setup Keyboard Listening
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

process.stdin.on("keypress", (str, key) => {
  if (key && (key.ctrl && key.name === "c" || key.name === "q")) {
    process.stdout.write("\\x1b[2J\\x1b[H\\x1b[?25h"); // Restore screen and show cursor
    server.close();
    process.exit(0);
  }

  if (key.name === "space" || key.sequence === "+") {
    store.actions.increment();
    logAction("Local keypress: [increment]");
  } else if (key.sequence === "-") {
    store.actions.decrement();
    logAction("Local keypress: [decrement]");
  } else if (key.name === "r") {
    store.actions.reset();
    logAction("Local keypress: [reset]");
  }
});
`;
}

// Function to run Option 1: Setup & Generate Example
async function setupAndInstall() {
  printBanner();
  const pm = detectPackageManager();
  console.log(`   ${WHITE}📦 Detected Workspace Package Manager:${RESET} ${GREEN}${pm}${RESET}\n`);

  console.log(`   ${CYAN}⚡ Running installation command...${RESET}`);
  let installCmd = "";
  switch (pm) {
    case "npm": installCmd = "npm install elegant-store"; break;
    case "pnpm": installCmd = "pnpm add elegant-store"; break;
    case "yarn": installCmd = "yarn add elegant-store"; break;
    case "bun": installCmd = "bun add elegant-store"; break;
  }
  console.log(`   ${GREY}> ${installCmd}${RESET}\n`);

  try {
    const demoDir = path.join(process.cwd(), "elegant-store-demo");
    if (!fs.existsSync(demoDir)) {
      fs.mkdirSync(demoDir, { recursive: true });
    }

    // Write elegant-store-demo/package.json
    const pkgJson = {
      name: "elegant-store-demo",
      version: "1.0.0",
      type: "module",
      scripts: {
        start: "node tui.js"
      },
      dependencies: {
        "elegant-store": "^3.1.0"
      }
    };
    fs.writeFileSync(path.join(demoDir, "package.json"), JSON.stringify(pkgJson, null, 2));

    // Write elegant-store-demo/store.js
    const storeJs = `import { createStore } from "elegant-store";

export const counterStore = createStore(
  { count: 0 },
  {
    increment: (state) => ({ count: state.count + 1 }),
    decrement: (state) => ({ count: state.count - 1 }),
    reset: () => ({ count: 0 }),
    set: (state, val) => ({ count: val }),
  }
);
`;
    fs.writeFileSync(path.join(demoDir, "store.js"), storeJs);

    // Write elegant-store-demo/tui.js
    const tuiJs = getTuiTemplate("elegant-store");
    fs.writeFileSync(path.join(demoDir, "tui.js"), tuiJs);

    // Write README.md
    const readmeMd = `# Elegant Store Interactive Counter TUI Demo

This project demonstrates the reactive elegant-store using a gorgeous interactive terminal dashboard UI and a remote execution HTTP server.

## Getting Started

1. Navigate into the demo folder:
   \`\`\`bash
   cd elegant-store-demo
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   ${pm} install
   \`\`\`

3. Launch the Interactive Dashboard:
   \`\`\`bash
   ${pm} start
   \`\`\`

## Features

- **Keyboard Controls**: Press \`Space\`/\`+\` to increment, \`-\` to decrement, \`R\` to reset, and \`Q\` to quit.
- **Remote execution server**: Run cURL commands or open your browser at the endpoints listed on the dashboard to update the store state in real-time!
`;
    fs.writeFileSync(path.join(demoDir, "README.md"), readmeMd);

    console.log(`   ${GREEN}✔ Installation completed and example project generated successfully!${RESET}\n`);
    console.log(`   ${WHITE}Example files written to:${RESET} ${CYAN}./elegant-store-demo/${RESET}\n`);
    console.log(`   ${WHITE}To run the interactive demonstration store:${RESET}`);
    console.log(`     ${GOLD}1. cd elegant-store-demo${RESET}`);
    console.log(`     ${GOLD}2. ${pm} install${RESET}`);
    console.log(`     ${GOLD}3. ${pm} start${RESET}\n`);
    
    // Pause to let user read
    console.log(`   ${GREY}Press any key to return to the main menu...${RESET}`);
    await new Promise<void>((resolve) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.once("data", () => {
        process.stdin.setRawMode(false);
        resolve();
      });
    });
  } catch (error: any) {
    console.log(`   ${RED}✖ Failed to run installer: ${error.message}${RESET}`);
  }
}

// Function to run Option 2: Live Local Demo
function runLocalDemo() {
  console.clear();
  const store = createStore(
    { count: 0 },
    {
      increment: (state) => ({ count: state.count + 1 }),
      decrement: (state) => ({ count: state.count - 1 }),
      reset: () => ({ count: 0 }),
      set: (_state, val: number) => ({ count: val }),
    }
  );

  const historyLogs: string[] = [];
  const PORT = 3000;

  function logAction(message: string) {
    const time = new Date().toTimeString().split(" ")[0];
    historyLogs.push(`[${time}] ${message}`);
    if (historyLogs.length > 5) {
      historyLogs.shift();
    }
  }

  function drawDashboard() {
    const state = store.getState();
    const width = 60;
    const stdout = process.stdout;
    
    stdout.write("\x1b[2J\x1b[H"); // Clear screen and home cursor

    let out = "";
    
    // 1. Header
    out += `${PURPLE}┌${"─".repeat(width - 2)}┐${RESET}\n`;
    out += `${PURPLE}│${WHITE}        ✨  ELEGANT STORE - INTERACTIVE LIVE DASHBOARD  ✨        ${PURPLE}│${RESET}\n`;
    out += `${PURPLE}└${"─".repeat(width - 2)}┘${RESET}\n\n`;

    // 2. Counter Status
    out += `   ${WHITE}STORE STATE STATUS:${RESET}\n`;
    out += `   ${GREY}Current Count:${RESET}  ${GREEN}${state.count >= 0 ? "▲" : "▼"} ${state.count}${RESET}\n`;
    
    // 3. Progress bar
    const barWidth = 30;
    const maxVal = 20;
    const percentage = Math.min(Math.max((state.count + maxVal) / (maxVal * 2), 0), 1);
    const filled = Math.round(barWidth * percentage);
    const empty = barWidth - filled;
    const bar = `${GREEN}${"█".repeat(filled)}${DARK_GREY}${"░".repeat(empty)}`;
    out += `   ${GREY}Range [-20,20]:${RESET} [${bar}${RESET}] (${Math.round(percentage * 100)}%)\n\n`;

    // 4. Remote Execution Server Info
    out += `   ${WHITE}REMOTE EXECUTION SERVER:${RESET}\n`;
    out += `   ${GREY}Status:${RESET}      ${GREEN}● Online${RESET} on ${CYAN}http://localhost:${PORT}${RESET}\n`;
    out += `   ${GREY}API Endpoints (cURL / Browser):${RESET}\n`;
    out += `     ${MAGENTA}▸ GET /increment${RESET}  ${DARK_GREY}→  Increments count${RESET}\n`;
    out += `     ${MAGENTA}▸ GET /decrement${RESET}  ${DARK_GREY}→  Decrements count${RESET}\n`;
    out += `     ${MAGENTA}▸ GET /set?val=N ${RESET}  ${DARK_GREY}→  Sets count to N${RESET}\n`;
    out += `     ${MAGENTA}▸ GET /reset     ${RESET}  ${DARK_GREY}→  Resets count${RESET}\n\n`;

    // 5. Action History
    out += `   ${WHITE}LIVE LOGS & ACTION HISTORY:${RESET}\n`;
    if (historyLogs.length === 0) {
      out += `     ${DARK_GREY}(No actions recorded yet)${RESET}\n`;
    } else {
      historyLogs.forEach(log => {
        out += `     ${log}\n`;
      });
    }
    out += `\n`;

    // 6. Keyboard Footer
    out += `${PURPLE}┌${"─".repeat(width - 2)}┐${RESET}\n`;
    out += `${PURPLE}│${WHITE}  [Space/+] Inc   [-] Dec   [R] Reset   [Q] Quit & Stop Server  ${PURPLE}│${RESET}\n`;
    out += `${PURPLE}└${"─".repeat(width - 2)}┘${RESET}\n`;

    stdout.write(out);
  }

  // Subscribe dashboard draw to store changes
  store.subscribe(drawDashboard);

  // Setup HTTP Remote Execution Server
  const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    const parsedUrl = new URL(req.url || "", `http://localhost:${PORT}`);
    const pathname = parsedUrl.pathname;
    const ip = req.socket.remoteAddress || "127.0.0.1";

    if (pathname === "/increment") {
      store.actions.increment();
      logAction(`Remote [increment] from ${ip}`);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, count: store.getState().count }));
    } else if (pathname === "/decrement") {
      store.actions.decrement();
      logAction(`Remote [decrement] from ${ip}`);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, count: store.getState().count }));
    } else if (pathname === "/reset") {
      store.actions.reset();
      logAction(`Remote [reset] from ${ip}`);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, count: store.getState().count }));
    } else if (pathname === "/set") {
      const valStr = parsedUrl.searchParams.get("val");
      const val = parseInt(valStr || "", 10);
      if (!isNaN(val)) {
        store.actions.set(val);
        logAction(`Remote [set] to ${val} from ${ip}`);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, count: store.getState().count }));
      } else {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: "Invalid val parameter" }));
      }
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not Found" }));
    }
  });

  server.listen(PORT, () => {
    logAction("Server initialized successfully");
    drawDashboard();
  });

  // Setup Keyboard Listening
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  const handleKey = (_str: string, key: any) => {
    if (key && (key.ctrl && key.name === "c" || key.name === "q")) {
      process.stdout.write("\x1b[2J\x1b[H\x1b[?25h"); // Restore screen and show cursor
      server.close();
      process.stdin.off("keypress", handleKey);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      mainLoop();
      return;
    }

    if (key.name === "space" || key.sequence === "+") {
      store.actions.increment();
      logAction("Local keypress: [increment]");
    } else if (key.sequence === "-") {
      store.actions.decrement();
      logAction("Local keypress: [decrement]");
    } else if (key.name === "r") {
      store.actions.reset();
      logAction("Local keypress: [reset]");
    }
  };

  process.stdin.on("keypress", handleKey);
}

// Main CLI Event Loop
async function mainLoop() {
  while (true) {
    printBanner();
    const selection = await selectMenu("Select an action to proceed:", [
      "Setup & Install package inside workspace (Create Example)",
      "Run Local Counter store live demonstration (TUI & Server)",
      "Exit Initializer"
    ]);

    if (selection === 0) {
      await setupAndInstall();
    } else if (selection === 1) {
      runLocalDemo();
      break; // Exit mainLoop and let runLocalDemo handle CLI flow
    } else {
      console.clear();
      console.log(`\n   ${GREEN}Thank you for using Elegant Store! Have a fantastic coding session! 🚀${RESET}\n`);
      process.exit(0);
    }
  }
}

// Launch the CLI tool
mainLoop();
