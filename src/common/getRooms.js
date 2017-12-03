'use strict'

let http = require('request-promise')
let _ = require('lodash')

function getLights (request, context) {
  let body = request.body
  let options = {
    method: 'GET',
    uri: `http://${body.hueip}/api/${body.apikey}/groups`,
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