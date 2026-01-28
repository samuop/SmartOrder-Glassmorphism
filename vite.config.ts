import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@views': path.resolve(__dirname, './src/views'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@theme': path.resolve(__dirname, './src/theme'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      'components': path.resolve(__dirname, './src/components'),
      'views': path.resolve(__dirname, './src/views'),
      'theme': path.resolve(__dirname, './src/theme'),
      'variables': path.resolve(__dirname, './src/variables'),
      'layouts': path.resolve(__dirname, './src/layouts'),
      'assets': path.resolve(__dirname, './src/assets'),
      'services': path.resolve(__dirname, './src/services'),
      'types': path.resolve(__dirname, './src/types'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  server: {
    port: 3000,
    open: true,
  },
})
