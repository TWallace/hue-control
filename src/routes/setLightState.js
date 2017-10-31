'use strict'

let setLightState = require('../handlers/setLightState.js')
let createSpan = require('../common/createSpan.js')
let createContext = require('../common/createContext.js')
let getLights = require('../handlers/getLights.js')
var _ = require('lodash')

module.exports = function (app) {
  app.post('/setLightState', function (req, res) {
    let context = createContext(req)
    let span = createSpan(req, context)
    let body = req.body

    if (!body.lights.length || !Array.isArray(body.lights)) {
      res.statusCode = 400
      res.send('Must specify lights')
    }

    if (!body.colors.length || !Array.isArray(body.colors)) {
      res.statusCode = 400
      res.send('Must specify colors array')
    }

    if (body.lights.length > body.colors.length && !body.synchronized) {
      res.statusCode = 400
      res.send('Number of lights must be >= number of colors, unless synchronized is set to true')
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
        span.addTags({
          httpResponse: 200
        })
        span.finish()
        res.status(200).send(response)
      })
      .catch(function (error) {
        span.addTags({
          error: error
        })
        span.finish()
        res.status(error.statusCode || 500).send(error.message)
      })
    })
  })
}
