'use strict'

let http = require('request-promise')
let _ = require('lodash')
let Promise = require('bluebird')

module.exports = function (request, lights) {
  let body = request.body
  return Promise.map(lights, function (light) {
    let options = {
      method: 'PUT',
      uri: `http://${body.hueip}/api/${body.apikey}/lights/${light.id}/state`,
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