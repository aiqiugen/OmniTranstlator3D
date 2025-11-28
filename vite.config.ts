import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Strictly replace the API Key variable required by the Google GenAI SDK
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});