'use strict'

let http = require('request-promise')
let _ = require('lodash')
let Promise = require('bluebird')

function getRoomLightState (request, context) {
  let headers = request.headers
  let options = {
    method: 'GET',
    uri: `http://${headers.hueip}/api/${headers.apikey}/groups/${request.groupId}`,
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
      options.uri = `http://${headers.hueip}/api/${headers.apikey}/lights/${light}`
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
