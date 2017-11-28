'use strict'

let http = require('request-promise')
let _ = require('lodash')

function getLights (request, context) {
  let headers = request.headers
  let options = {
    method: 'GET',
    uri: `http://${headers.hueip}/api/${headers.apikey}/groups`,
    json: true,
    traceContext: context
  }
  return http.get(options)
  .then(function(response) {
    if (_.get(response, '[0].error')) {
      throw response[0].error
    }
    let rooms = []
    _.forOwn(response, function (key, value) {
      rooms.push(_.merge({ id: value }, _.pick(key, ['name', 'state'])))
    })
    return rooms
  })
}

module.exports = getLights