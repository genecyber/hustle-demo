import { defineConfig } from 'tsup';

export default defineConfig([
  // Library builds (ESM + CJS)
  {
    entry: {
      index: 'src/index.ts',
      'components/index': 'src/components/index.ts',
      'hooks/index': 'src/hooks/index.ts',
      'providers/index': 'src/providers/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom'],
    treeshake: true,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
    esbuildOptions(options) {
      options.banner = {
        js: '"use client";',
      };
    },
  },
  // Browser bundle (ESM for import maps)
  {
    entry: { 'hustle-react': 'src/index.ts' },
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false,
    external: ['react', 'react-dom', 'emblem-auth-sdk', 'hustle-incognito'],
    treeshake: true,
    minify: false,
    target: 'es2020',
    outDir: 'dist/browser',
    platform: 'browser',
  },
]);
