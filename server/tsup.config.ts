import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    './src/index.ts',
    './src/app.ts',
    "./src/plugins/**/*.ts",
    "./src/routes/**/*.ts",
  ],
  splitting: false,
  sourcemap: true,
  clean: true,

})