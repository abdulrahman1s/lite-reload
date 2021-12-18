const fs = require('fs/promises')
const packageJSON = require('../../package.json')

const bye = (code = 1) => process.exit(code),
  err = (...args) => {
    console.error(...args)
    bye()
  },
  say = (...args) => {
    console.log(...args)
    bye()
  }


class CLI {
  constructor(options) {
    this.options = options
  }

  async parse(key, value) {
    if (!this.options[key]) err(`This option "${key}" not exists`)

    switch (this.options[key]) {
      case 'boolean':
        if (!value) return true

        if (['true', 'false'].includes(value)) return value === 'true'

        err(`${key}: Should be a "true" or "false", or empty for true`)
      case 'path':
        const exists = value && await fs.access(value).then(() => true).catch(() => false)

        if (exists) return value

        err(`${key}: Is not a valid path`)
      case 'string':
        if (value) return value

        err(`${key}: Should be a non-empty string`)
      case 'number':
        const parsed = parseInt(value)

        if (!isNaN(parsed)) return parsed

        err(`${key}: Should be a valid number`)
      default:
        throw new Error(`Unhandled type for ${key}:${this.options[key]}`)
    }
  }

  async collect() {
    const result = {}

    const args = process.argv.slice(2)

    for (const arg of args) {
      if (!arg.startsWith('--')) {
        result['dir'] = await this.parse('dir', arg)
        continue
      }

      const [flag, value] = arg.slice(2).split('=')

      if (flag === 'version') this.version()
      if (flag === 'help') this.help()

      result[flag] = await this.parse(flag, value)
    }

    if (!Object.keys(result).length) this.help()

    return result
  }


  help() {
    say(`
      ${packageJSON.name} is a tiny web server with live reload.

      Usage: ${packageJSON.name} <dir> [...parms]

      Parameters: 
        host  [default: localhost]  Host where to bind server
        port  [default: 8080]       Port where to bind server
        index [default: index.html] Index file for server
        help                        Show usage information
      
      Examples: 
        ${packageJSON.name} dist/public --port=7070
        ${packageJSON.name} --host=0.0.0.0 --port=8080
    `)
  }


  version() {
    say(`${packageJSON.name} version: v${packageJSON.version}`)
  }
}


module.exports = CLI
