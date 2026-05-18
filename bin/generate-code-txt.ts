/// <reference types="node" />
// this script will take the latest code in `src/index.ts` and save it in `code.txt` for the LLM 

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const code = fs.readFileSync(path.join(__dirname, "../src/index.ts"), "utf-8");
fs.writeFileSync(path.join(__dirname, "../code.txt"), code);