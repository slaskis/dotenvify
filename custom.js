var dotenv = require('dotenv')
  , through = require('through')
  , jstransform = require('jstransform')
  , createVisitors = require('./visitors')
  , deepEqual = require('deep-equal')

var processEnvPattern = /\bprocess\.env\b/

var _options, _result
function loadEnv (argv) {
  var options = {silent: argv.silent, path: argv.path, encoding: argv.encoding}
  if (_result === true && deepEqual(options, _options)) return
  _result = dotenv.load(argv)
  _options = options
}

module.exports = function(rootEnv) {
  rootEnv = rootEnv || process.env || {}

  return function dotenvify(file, argv) {
    loadEnv(argv)
    if (/\.json$/.test(file)) return through()

    var buffer = []
    argv = argv || {}

    return through(write, flush)

    function write(data) {
      buffer.push(data)
    }

    function flush() {
      var source = buffer.join('')

      if (processEnvPattern.test(source)) {
        try {
          var visitors = createVisitors([argv, rootEnv])
          source = jstransform.transform(visitors, source).code
        } catch(err) {
          return this.emit('error', err)
        }
      }

      this.queue(source)
      this.queue(null)
    }
  }
}
