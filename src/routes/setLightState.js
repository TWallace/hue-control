'use strict'

let setLightState = require('../handlers/setLightState.js')
let createSpan = require('../common/createSpan.js')
let createContext = require('../common/createContext.js')
let getLights = require('../handlers/getLights.js')
let _ = require('lodash')

module.exports = function (app) {
  app.post('/setLightState', function (req, res) {
    let context = createContext(req)
    context.span = createSpan(req, context)
    let body = req.body
    let headers = req.headers

    if (!headers.apikey) {
      res.statusCode = 400
      res.send('Must specify apikey in headers.')
    }

    if (!headers.hueip) {
      res.statusCode = 400
      res.send('Must specify hueip in headers.')
    }

    if (!body.lights.length || !Array.isArray(body.lights)) {
      res.statusCode = 400
      res.send('Must specify lights')
    }

    if (!body.colors.length || !Array.isArray(body.colors)) {
      res.statusCode = 400
      res.send('Must specify colors array')
    }

    if (body.lightHoldTime || body.lightHoldTime === 0) {
      if (isNaN(body.lightHoldTime) || body.lightHoldTime < 100) {
        res.statusCode = 400
        res.send('lightHoldTime must be a number >= 100')
      }
    }

    if (body.transitionTime || body.transitionTime === 0) {
      if (isNaN(body.transitionTime) || body.transitionTime < 500) {
        res.statusCode = 400
        res.send('transitionTime must be a number >= 500')
      }
    }

    _.forEach(body.colors, function (colors) {
      // ensure each color value is an array of 2 floats, each one between 0 and 1
      let errorMessage

      if (colors.length < 2 || colors.length > 3) {
        errorMessage = `${colors} is not a valid color value. Must be an array with length of 2`
      }

      _.forEach(colors, function (color, index) {
        // only need to validate first 2 items in array, as third one is optional color description
        if (index < 2) {
          if (!parseFloat(color)) {
            errorMessage = `${color} is not a valid color value. Must be a decimal between 0 and 1.`
          } else if (color < 0 || color > 1) {
            errorMessage = `${color} is not a valid color value. Must be between 0 and 1`
          }
        }
      })

      if (errorMessage) {
        res.statusCode = 400
        res.send(errorMessage)
      }
    })

    if (body.synchronized && body. sequential) {
      res.statusCode = 400
      res.send('Cannot specify both sequential and synchronized as true')
    }

    if (body.lights.length > body.colors.length && !body.synchronized) {
      res.statusCode = 400
      res.send('Number of lights must be >= number of colors, unless synchronized is set to true')
    }

    if (res.statusCode !== 200) {
      return res
    }

    return getLights(req, context)
    .then(function (response) {
      let lights = _.map(response, function (light) {
        return light.name
      })
      _.forEach(body.lights, function (light) {
        if (lights.indexOf(light) < 0) {
          res.statusCode = 400
          res.send(`${light} is an invalid light name`)
        }
      })

      return setLightState(req, context)
      .then(function (response) {
        context.span.addTags({
          httpResponse: 200
        })
        context.span.finish()
        res.status(200).send(response)
      })
      .catch(function (error) {
        context.span.addTags({
          error: true,
          errorDetails: error
        })
        context.span.finish()
        res.status(error.statusCode || 500).send(error.message)
      })
    })
  })
}
