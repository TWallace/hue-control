'use strict'

let tracer = require('ctrace-js')

function createSpan(req, context) {
  // context = tracer.extract(tracer.FORMAT_HTTP_HEADERS, req.headers)
  return tracer.startSpan('GetLights', {
    childOf: context,
    tags: {
      'spanKind': 'server',
      'peeriIpv4': req.ip,
      'httpMethod': req.method,
      'httpUrl': req.url
    }
  })
}

module.exports = createSpan