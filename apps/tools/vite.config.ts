import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { studioSavePlugin } from "./src/server/studio-save-plugin";

export default defineConfig({
  plugins: [react(), studioSavePlugin()],
  server: {
    port: 5174
  }
});
