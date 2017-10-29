'use strict'

let http = require('request-promise')
let Promise = require('bluebird')
let _ = require('lodash')
let getLights = require('../common/getLights.js')
const LIGHT_DELAY_TIME = 10000
let interval

function updateLightColor(request, context) {
  let headers = request.headers
  let body = request.body
  let options = {
    method: 'PUT',
    uri: `http://${headers.hueip}/api/${headers.apikey}/lights/${request.light.id}/state`,
    body: {
      xy: request.color,
      transitiontime: body.transitionTime / 100
    },
    json: true,
    traceContext: context
  }
  return http.put(options)
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

function updateCameras(request, context, filteredLights) {
  let body = request.body
  let colors = body.colors
  return Promise.map(filteredLights, function (light) {
    let startingIndex = _.random(0, colors.length - 1)
    let color = colors[startingIndex]
    console.log(`Changing ${light.name} color to ${color}`)
    return updateLightColor(_.merge(request, {
      color: color,
      light: light
    }), context)
  })
}

function setLightState (request, context) {
  let body = request.body
  let lights = body.lights

  return getLights(request)
  .then(function (response) {
    let filteredLights = _.filter(response, function (light) {
      return lights.indexOf(light.name) > -1
    })
    clearInterval(interval)
    return updateCameras(request, context, filteredLights)
    .then(function () {
      interval = setInterval(function () {
        return updateCameras(request, context, filteredLights)
      }, body.transitionTime + LIGHT_DELAY_TIME)
    })
  })
}

module.exports = setLightState
