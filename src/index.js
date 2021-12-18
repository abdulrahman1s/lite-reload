#!/usr/bin/env node

const {
  CLI,
  HTTPServer
} = require('./modules')

const cli = new CLI({
  host: 'string',
  port: 'number',
  dir: 'path',
  index: 'string'
})

const margeDefaultOptions = (options) => Object.assign({
  dir: './public',
  host: 'localhost',
  port: 8080,
  index: 'index.html'
}, options);


(async () => {
  const options = margeDefaultOptions(await cli.collect())
  const server = new HTTPServer(options)
  const { port, host, dir } = options

  server.watch(dir).on('change', () => {
    server.reload()
    console.log('File changed')
  })

  await server.listen()

  console.log(`Server starting at: http://${host}:${port}`)
  console.log('Waiting for changes...\n\n')
})().catch(err => {
  console.error(err)
  process.exit(-1)
})
