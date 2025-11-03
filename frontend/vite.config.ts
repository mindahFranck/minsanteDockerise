import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        // Ignore the specific external module warning
        if (
          warning.code === "UNRESOLVED_IMPORT" ||
          warning.code === "SOURCEMAP_ERROR" ||
          warning.message.includes("externalize this module")
        ) {
          return;
        }
        defaultHandler(warning);
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
});
