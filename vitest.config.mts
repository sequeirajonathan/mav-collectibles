import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "components",
          include: ["tests/components/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["tests/components/setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          // Runs against the local Supabase database (npm run db:start).
          fileParallelism: false,
          setupFiles: ["tests/integration/setup.ts"],
        },
      },
    ],
    // `server-only` throws outside React Server Components; it's irrelevant in tests.
    alias: { "server-only": new URL("./tests/support/empty.ts", import.meta.url).pathname },
  },
});
