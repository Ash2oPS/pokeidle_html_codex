import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const targetPath = path.join(rootDir, "scripts", "map", "export-zone-encounters-csv.mjs");
await import(pathToFileURL(targetPath).href);
