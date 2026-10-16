import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The dev server only serves the base WITH its trailing slash — a bare
// /social-card 404s, while production's vercel.json rewrites both forms.
// Redirect the bare form so local URLs behave like deployed ones.
function redirectBareBase(base: string): Plugin {
  const bareBase = base.replace(/\/+$/, '')
  return {
    name: 'redirect-bare-base',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === bareBase || req.url === `${bareBase}?`) {
          res.statusCode = 308
          res.setHeader('Location', `${bareBase}/`)
          res.end()
          return
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/social-card/',
  plugins: [redirectBareBase('/social-card/'), react(), tailwindcss()],
  build: {
    modulePreload: {
      polyfill: false,
    },
  },
})
