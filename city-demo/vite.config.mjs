import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {guidePlugin} from './server/guidePlugin.mjs';
export default defineConfig({
  plugins:[react(),guidePlugin()],
  build:{outDir:'dist/client',rollupOptions:{input:{city:'index.html',models:'models.html'}}},
  server:{host:'127.0.0.1',port:4174,strictPort:true},
});
