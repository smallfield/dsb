import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/departure": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
