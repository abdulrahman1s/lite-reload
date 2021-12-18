const http = require('http')
const path = require('path')
const { watch, promises: fs } = require('fs')

const mime = {
  ".htm": "text/html",
  ".html": "text/html",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".js": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".ico": "image/x-icon"
}

class HTTPServer {
  constructor(options) {
    this.options = options
    this.clients = new Set()
    this.http = http.createServer(this.handle.bind(this))
  }

  handleSSE(_req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    const client = {
      reload: () => client.send('RELOAD'),
      send: (data) => res.write(`data: "${data}"\n\n`)
    }

    this.clients.add(client)

    res.once('close', () => this.clients.delete(client))
  }

  async handle(req, res) {
    if (req.url === '/lite-reload-remote') return this.handleSSE(req, res)

    let filePath = path.join(this.options.dir, new URL(req.url, 'http://' + req.headers.host).pathname)

    if (filePath.endsWith('/')) filePath += this.options.index

    const extname = path.extname(filePath)

    if (mime[extname]) res.setHeader('Content-Type', mime[extname]);

    let content

    try {
      content = await fs.readFile(filePath)
    } catch {
      res.writeHead(404)
      return res.end('Not Found')
    }

    if (['.html', '.htm'].includes(extname)) {
      const inject = `<script>(${ClientLiveServer})()</script>$1`
      content = Buffer.from(content.toString('utf8').replace(/(<\/body>)/, inject))
    }

    res.end(content)
  }


  watch(dir, fn) {
    return watch(dir, {}, fn)
  }


  reload() {
    for (const client of this.clients) client.reload()
  }

  listen() {
    return new Promise(ok => this.http.listen(this.options.port, this.options.host, ok))
  }
}


function ClientLiveServer() {
  if (typeof EventSource === 'undefined') {
    return console.error("The browser deosn't support SSE.. upgrade your browser please!")
  }
  new EventSource('/lite-reload-remote').onmessage = () => location.reload()
}


module.exports = HTTPServer
