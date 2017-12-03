'use strict'

let http = require('request-promise')
let _ = require('lodash')
let Promise = require('bluebird')

function getRoomLightState (request, context) {
  let body = request.body
  let options = {
    method: 'GET',
    uri: `http://${body.hueip}/api/${body.apikey}/groups/${request.groupId}`,
    json: true,
    traceContext: context
  }
  let lights = []
  return http.get(options)
  .then(function (response) {
    // need to store light id in response
    _.forEach(response.lights, function (light) {
      lights.push({
        id: light
      })
    })
    return Promise.map(response.lights, function (light) {
      options.uri = `http://${body.hueip}/api/${body.apikey}/lights/${light}`
      return http.get(options)
    })
  })
  .then(function (results) {
    _.forEach(results, function (light, index) {
      lights[index].state = light.state
    })
    return lights
  })
}

module.exports = getRoomLightState
