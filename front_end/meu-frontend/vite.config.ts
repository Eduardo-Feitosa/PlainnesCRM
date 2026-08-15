import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const removeCssSourceMappingUrl = () => ({
  name: 'remove-css-sourcemappingurl',
  transform(code: string, id: string)
  {
    if (!id || !id.includes('.css')) return null;
    if (!/\/\*# sourceMappingURL=.*? \*\//.test(code)) return null;
    const limpo = code.replace(/\/\*# sourceMappingURL=.*? \*\//g, '');
    return { code: limpo, map: null };
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    removeCssSourceMappingUrl(),
  ],
  build: {
    cssMinify: true,
    sourcemap: false,
  },
  css: {
    devSourcemap: false,
  },
})
