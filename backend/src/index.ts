import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

app.use('/*', cors())

app.get('/departure', async (c) => {
  const path = c.req.query('path')
  if (!path) {
      return c.json({ error: 'Missing path parameter' }, 400)
  }
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  const url = encodeURI(`wss://api.mittog.dk/api/ws/${cleanPath}`)
  
  try {
    return await new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      
      const cleanup = () => {
         ws.close()
      }

      ws.addEventListener('open', () => {
        console.log('Connected to WebSocket')
      })

      ws.addEventListener('message', (event) => {
        console.log('Received message:', event.data)
        cleanup()
        try {
            const data = JSON.parse(event.data as string)
            resolve(c.json(data))
        } catch (e) {
            resolve(c.json({ error: 'Failed to parse JSON', raw: event.data }, 500))
        }
      })

      ws.addEventListener('error', (e) => {
         console.error('WebSocket error:', e)
         cleanup()
         resolve(c.json({ error: 'WebSocket error' }, 500))
      })
      
      setTimeout(() => {
          if(ws.readyState !== 3) { // 3 is CLOSED
               cleanup()
               resolve(c.json({ error: 'Timeout waiting for message' }, 504))
          }
      }, 5000)
    })
  } catch (e) {
      console.error('Handler error:', e)
      return c.json({ error: 'Internal Server Error', details: String(e) }, 500)
  }
})

export default app

// @ts-ignore
import manifest from '__STATIC_CONTENT_MANIFEST'

app.get('/*', serveStatic({
  root: './',
  manifest,
  rewriteRequestPath: (path) => {
    // 拡張子が含まれていないパスへのアクセスは index.html とみなす
    return path.includes('.') ? path : '/index.html'
  }
}))

