'use strict'

let uuid = require('node-uuid')

module.exports = function (req) {
  return {
    correlationId: req.headers.correlationid || uuid.v4()
  }
}
