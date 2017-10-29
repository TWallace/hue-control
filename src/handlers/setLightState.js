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

function getNextColor(colors, currentIndex) {
  return currentIndex === colors.length - 1
    ? 0
    : currentIndex + 1
}

function updateCameras(request, context, filteredLights) {
  let body = request.body
  let colors = body.colors
  return Promise.map(filteredLights, function (light) {
    // todo: instead of random, choose next color from original array

    let color = colors[light.nextColorIndex]
    console.log(`Changing ${light.name} color to ${color}`)
    return updateLightColor(_.merge(request, {
      color: color,
      light: light
    }), context)
    .then(function () {
      light.nextColorIndex = getNextColor(colors, light.nextColorIndex)
    })
  })
  .then(function () {
    return filteredLights
  })
}

function setLightState (request, context) {
  let body = request.body
  let lights = body.lights
  let colors = body.colors

  return getLights(request)
  .then(function (response) {
    let filteredLights = _.filter(response, function (light) {
      return lights.indexOf(light.name) > -1
    })

    let usedColors = []
    function getUniqueRandomColor(colors) {
      let colorIndex = _.random(0, colors.length - 1)
      if (usedColors.indexOf(colorIndex) > -1) {
        return getUniqueRandomColor(colors)
      } else {
        usedColors.push(colorIndex)
        return colorIndex
      }
    }

    _.forEach(filteredLights, function (light) {
      light.startingColorIndex = getUniqueRandomColor(colors)
      light.nextColorIndex = getNextColor(colors, light.startingColorIndex)
    })
    clearInterval(interval)
    return updateCameras(request, context, filteredLights)
    .then(function (lights) {
      filteredLights = lights
      interval = setInterval(function () {
        return updateCameras(request, context, filteredLights)
        .then(function (lights) {
          filteredLights = lights
        })
      }, body.transitionTime + LIGHT_DELAY_TIME)
    })
  })
}

module.exports = setLightState
