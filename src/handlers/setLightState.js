'use strict'

let config = require('config-yml')
let http = require('request-promise')
let Promise = require('bluebird')
let getLights = require('../common/getLights.js')

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

function setLightState (request, context) {
  let body = request.body
  let lights = body.lights
  let colors = body.colors

  return getLights(request)
  .then(function (response) {
    let filteredLights = _.filter(response, function (light) {
      return lights.indexOf(light.name) > -1
    })
    setInterval(function () {
      return Promise.map(filteredLights, function (light) {
        let startingIndex = _.random(0, colors.length - 1)
        let color = colors[startingIndex]
        return updateLightColor(_.merge(request, {
          color: color,
          light: light
        }), context)
      })
    }, body.transitionTime)
  })
}

module.exports = setLightState
