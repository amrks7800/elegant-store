#!/usr/bin/env node

import fs from "fs";
import http from "http";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";
import { createStore } from "../dist/index.js";

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
  const logo = [
    " ______ _                                _      ",
    "|  ____| |                              | |     ",
    "| |__  | | ___  __ _  __ _ _ __   ___    | |__  ",
    "|  __| | |/ _ \\/ _` |/ _` | '_ \\ / __|   | '_ \\ ",
    "| |____| |  __/ (_| | (_| | | | | (__  _  | |_) |",
    "|______|_|\\___|\\__,_|\\__,_|_| |_|\\___|(_) |_.__/ ",
    "                __/ |                           ",
    "               |___/                            "
  ];
  
  console.clear();
  console.log(`${PURPLE}â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”${RESET}`);
  logo.forEach(line => {
    // Each line has a printed width of 48. Pad to 52 to center it in the 56-width border.
    const padded = line.padEnd(52, " ");
    console.log(`${PURPLE}â”‚${WHITE}  ${padded}  ${PURPLE}â”‚${RESET}`);
  });
  console.log(`${PURPLE}â”‚${CYAN}         âœ¨ Premium State Management Initializer âœ¨         ${PURPLE}â”‚${RESET}`);
  console.log(`${PURPLE}â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜${RESET}\n`);
}

// Detect the workspace package manager
function detectPackageManager() {
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
async function selectMenu(title, options) {
  let selectedIndex = 0;
  const stdout = process.stdout;

  const render = () => {
    stdout.write("\x1b[?25l"); // Hide cursor
    readline.cursorTo(stdout, 0);
    stdout.write(`   ${WHITE}${title}${RESET}\n\n`);
    
    options.forEach((opt, idx) => {
      if (idx === selectedIndex) {
        stdout.write(`    ${CYAN}âž” ${WHITE}${opt}${RESET}\n`);
      } else {
        stdout.write(`      ${GREY}${opt}${RESET}\n`);
      }
    });
    stdout.write(`\n   ${DARK_GREY}Use â†‘/â†“ arrows to navigate, Enter to select.${RESET}\n`);
  };

  const clearLines = (count) => {
    for (let i = 0; i < count; i++) {
      readline.moveCursor(stdout, 0, -1);
      readline.clearLine(stdout, 0);
    }
  };

  render();

  return new Promise((resolve) => {
    const handleKeypress = (_str, key) => {
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

// Function to run Option 1: Setup & Generate Example
async function setupAndInstall() {
  printBanner();
  const pm = detectPackageManager();
  console.log(`   ${WHITE}ðŸ“¦ Detected Workspace Package Manager:${RESET} ${GREEN}${pm}${RESET}\n`);

  let installCmd = "";
  switch (pm) {
    case "npm": installCmd = "npm install elegant-store"; break;
    case "pnpm": installCmd = "pnpm add elegant-store"; break;
    case "yarn": installCmd = "yarn add elegant-store"; break;
    case "bun": installCmd = "bun add elegant-store"; break;
  }

  try {
    console.log(`   ${CYAN}âš¡ Installing elegant-store dependency in the current project...${RESET}`);
    console.log(`   ${GREY}> ${installCmd}${RESET}\n`);
    execSync(installCmd, { stdio: "inherit" });
    
    // Check if TypeScript project
    const isTS = fs.existsSync(path.join(process.cwd(), "tsconfig.json")) ||
                 (fs.existsSync(path.join(process.cwd(), "package.json")) && 
                  fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8").includes("typescript"));

    const extension = isTS ? "ts" : "js";
    const hasSrc = fs.existsSync(path.join(process.cwd(), "src"));
    const relativeStorePath = hasSrc ? `src/store.${extension}` : `store.${extension}`;
    const storePath = path.join(process.cwd(), relativeStorePath);
      
    let storeContent = "";
    if (isTS) {
      storeContent = `import { createStore } from "elegant-store";

// Initialize your Elegant Store with automatic type inference
export const counterStore = createStore(
  { count: 0 },
  {
    increment: (state) => ({ count: state.count + 1 }),
    decrement: (state) => ({ count: state.count - 1 }),
    reset: () => ({ count: 0 }),
    set: (state, val: number) => ({ count: val }),
  }
);
`;
    } else {
      storeContent = `import { createStore } from "elegant-store";

// Initialize your Elegant Store
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
    }

    fs.writeFileSync(storePath, storeContent);

    console.log(`\n   ${GREEN}âœ” Package elegant-store installed successfully!${RESET}`);
    console.log(`   ${GREEN}âœ” Created type-safe demo store at:${RESET} ${CYAN}./${relativeStorePath}${RESET}\n`);

    console.log(`   ${WHITE}ðŸš€ How to use this store in React:${RESET}`);
    console.log(`     ${GOLD}1. Import the store hook and your new store:${RESET}`);
    console.log(`        ${GREY}import { useStore } from "elegant-store";${RESET}`);
    console.log(`        ${GREY}import { counterStore } from "./${relativeStorePath.replace("src/", "").replace(".ts", "").replace(".js", "")}";${RESET}\n`);
    console.log(`     ${GOLD}2. Bind it inside your React component:${RESET}`);
    console.log(`        ${GREY}const [state, actions] = useStore(counterStore);${RESET}\n`);
    console.log(`     ${GOLD}3. Render state and trigger actions:${RESET}`);
    console.log(`        ${GREY}<button onClick={actions.increment}>Count: {state.count}</button>${RESET}\n`);
    console.log(`   ${GREEN}âœ¨ You're all set! Start building elegant state machines! âœ¨${RESET}\n`);

    // Pause to let user read
    console.log(`   ${GREY}Press any key to return to the main menu...${RESET}`);
    await new Promise((resolve) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.once("data", () => {
        process.stdin.setRawMode(false);
        resolve();
      });
    });
  } catch (error) {
    console.log(`\n   ${RED}âœ– Failed to run installer: ${error.message}${RESET}\n`);
    
    // Pause to let user read error
    console.log(`   ${GREY}Press any key to return to the main menu...${RESET}`);
    await new Promise((resolve) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.once("data", () => {
        process.stdin.setRawMode(false);
        resolve();
      });
    });
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
      set: (_state, val) => ({ count: val }),
    }
  );

  const historyLogs = [];
  const PORT = 3000;

  function logAction(message) {
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
    out += `${PURPLE}â”Œ${"â”€".repeat(width - 2)}â”${RESET}\n`;
    out += `${PURPLE}â”‚${WHITE}        âœ¨  ELEGANT STORE - INTERACTIVE LIVE DASHBOARD  âœ¨        ${PURPLE}â”‚${RESET}\n`;
    out += `${PURPLE}â””${"â”€".repeat(width - 2)}â”˜${RESET}\n\n`;

    // 2. Counter Status
    out += `   ${WHITE}STORE STATE STATUS:${RESET}\n`;
    out += `   ${GREY}Current Count:${RESET}  ${GREEN}${state.count >= 0 ? "â–²" : "â–¼"} ${state.count}${RESET}\n`;
    
    // 3. Progress bar
    const barWidth = 30;
    const maxVal = 20;
    const percentage = Math.min(Math.max((state.count + maxVal) / (maxVal * 2), 0), 1);
    const filled = Math.round(barWidth * percentage);
    const empty = barWidth - filled;
    const bar = `${GREEN}${"â–ˆ".repeat(filled)}${DARK_GREY}${"â–‘".repeat(empty)}`;
    out += `   ${GREY}Range [-20,20]:${RESET} [${bar}${RESET}] (${Math.round(percentage * 100)}%)\n\n`;

    // 4. Remote Execution Server Info
    out += `   ${WHITE}REMOTE EXECUTION SERVER:${RESET}\n`;
    out += `   ${GREY}Status:${RESET}      ${GREEN}â— Online${RESET} on ${CYAN}http://localhost:${PORT}${RESET}\n`;
    out += `   ${GREY}API Endpoints (cURL / Browser):${RESET}\n`;
    out += `     ${MAGENTA}â–¸ GET /increment${RESET}  ${DARK_GREY}â†’  Increments count${RESET}\n`;
    out += `     ${MAGENTA}â–¸ GET /decrement${RESET}  ${DARK_GREY}â†’  Decrements count${RESET}\n`;
    out += `     ${MAGENTA}â–¸ GET /set?val=N ${RESET}  ${DARK_GREY}â†’  Sets count to N${RESET}\n`;
    out += `     ${MAGENTA}â–¸ GET /reset     ${RESET}  ${DARK_GREY}â†’  Resets count${RESET}\n\n`;

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
    out += `${PURPLE}â”Œ${"â”€".repeat(width - 2)}â”${RESET}\n`;
    out += `${PURPLE}â”‚${WHITE}  [Space/+] Inc   [-] Dec   [R] Reset   [Q] Quit & Stop Server  ${PURPLE}â”‚${RESET}\n`;
    out += `${PURPLE}â””${"â”€".repeat(width - 2)}â”˜${RESET}\n`;

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

  const handleKey = (_str, key) => {
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
      "Initialize & Install Elegant Store in current project",
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
      console.log(`\n   ${GREEN}Thank you for using Elegant Store! Have a fantastic coding session! ðŸš€${RESET}\n`);
      process.exit(0);
    }
  }
}

// Launch the CLI tool
mainLoop();
