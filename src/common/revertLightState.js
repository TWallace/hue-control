'use strict'

let http = require('request-promise')
let _ = require('lodash')
let Promise = require('bluebird')

module.exports = function (request, lights) {
  let headers = request.headers
  return Promise.map(lights, function (light) {
    let options = {
      method: 'PUT',
      uri: `http://${headers.hueip}/api/${headers.apikey}/lights/${light.id}/state`,
      body: _.omit(light.state, ['colormode', 'reachable']),
      json: true
    }
    return http.put(options)
  })
  .catch(function (error) {
    console.error(error)
    throw errors
  })
}