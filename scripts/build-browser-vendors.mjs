import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { build } from "vite";

const repoRoot = process.cwd();
const vendorOutDir = path.resolve(repoRoot, "vendor");
const entries = [
  {
    name: "howler",
    entry: path.resolve(repoRoot, "vendor-src/howler.entry.js"),
  },
  {
    name: "papaparse",
    entry: path.resolve(repoRoot, "vendor-src/papaparse.entry.js"),
  },
  {
    name: "zod",
    entry: path.resolve(repoRoot, "vendor-src/zod.entry.js"),
  },
];

await rm(vendorOutDir, { recursive: true, force: true });
await mkdir(vendorOutDir, { recursive: true });

for (const bundle of entries) {
  await build({
    configFile: false,
    build: {
      outDir: vendorOutDir,
      emptyOutDir: false,
      minify: false,
      sourcemap: false,
      lib: {
        entry: bundle.entry,
        formats: ["es"],
        fileName: () => `${bundle.name}.js`,
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  });
}
