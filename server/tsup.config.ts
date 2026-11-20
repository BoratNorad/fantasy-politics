import { defineConfig } from 'tsup';

// Bundles the server (and the workspace @fp/shared source) into dist/.
// Prisma and other node_modules stay external.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    weekly: 'src/jobs/weekly.ts',
    seed: 'prisma/seed/index.ts',
  },
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: ['@fp/shared'],
});
