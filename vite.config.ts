import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The dev server only serves the base WITH its trailing slash — a bare
// /social-card 404s, while production's vercel.json rewrites both forms.
// Redirect the bare form (query string intact) so local URLs behave like
// deployed ones; the base is read from the resolved config so this rule
// cannot drift from `base` above.
function redirectBareBase(): Plugin {
  let bareBase = ''
  return {
    name: 'redirect-bare-base',
    configResolved(config) {
      bareBase = config.base.replace(/\/+$/, '')
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const { pathname, search } = new URL(req.url ?? '/', 'http://localhost')
        if (pathname === bareBase) {
          res.statusCode = 308
          res.setHeader('Location', `${bareBase}/${search}`)
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
  plugins: [redirectBareBase(), react(), tailwindcss()],
  build: {
    modulePreload: {
      polyfill: false,
    },
  },
})
