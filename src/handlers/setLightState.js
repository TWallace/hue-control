'use strict'

let http = require('request-promise')
let Promise = require('bluebird')
let _ = require('lodash')
let getLights = require('../common/getLights.js')
let tracer = require('ctrace-js')
let interval
let defaults = {
  transitionTime: 15000,
  lightHoldTime: 15000
}

function updateLightColor(request, context) {
  let headers = request.headers
  let body = request.body
  let options = {
    method: 'PUT',
    uri: `http://${headers.hueip}/api/${headers.apikey}/lights/${request.light.id}/state`,
    body: {
      xy: request.color,
      transitiontime: Math.round((body.transitionTime || defaults.transitionTime) / 100)
    },
    json: true,
    traceContext: context
  }
  tracer.info(context, `Updating Light`, { options: _.omit(options, ['traceContext']) })
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
  .catch(function (error) {
    console.error('Unable to update light color:', JSON.stringify(error))
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
    let color = colors[light.nextColorIndex]
    return updateLightColor(_.merge(request, {
      color: color.slice(0, 2),
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
  let filteredLights = _.map(lights, function (light) {
    return { name: light }
  })

  return getLights(request)
  .then(function (response) {
    _.map(filteredLights, function (light) {
      let responseLight = _.find(response, function (l) {
        return l.name === light.name
      })
      if (responseLight) {
        light.id = responseLight.id
      }
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

    _.forEach(filteredLights, function (light, index) {
      if (body.synchronized) {
        light.startingColorIndex = filteredLights[0].startingColorIndex || getUniqueRandomColor(colors)
      } else if (body.sequential) {
        light.startingColorIndex = index
      } else {
        light.startingColorIndex = getUniqueRandomColor(colors)
      }
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
      }, body.transitionTime + (body.lightHoldTime || defaults.lightHoldTime))
    })
  })
  .catch(function (error) {
    if (error.message && error.stack) {
      let err = {
        stack: error.stack,
        message: error.message
      }
      tracer.error(context, 'Error setting light state', {
        err
      })
      throw err
    }
    throw error
  })
}

module.exports = setLightState
