'use strict'

let http = require('request-promise')
let _ = require('lodash')

function getLights (request, context) {
  let headers = request.headers
  let options = {
    method: 'GET',
    uri: `http://${headers.hueip}/api/${headers.apikey}/lights`,
    json: true,
    traceContext: context
  }
  return http.get(options)
  .then(function(response) {
    if (_.get(response, '[0].error')) {
      throw response[0].error
    }
    let lights = []
    _.forOwn(response, function (key, value) {
      lights.push(_.merge({ id: value }, _.pick(key, ['name', 'state', 'type'])))
    })
    return lights
  })
}

module.exports = getLights