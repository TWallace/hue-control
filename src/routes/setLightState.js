'use strict'

let setLightState = require('../handlers/setLightState.js')
let createSpan = require('../common/createSpan.js')
let createContext = require('../common/createContext.js')

module.exports = function (app) {
  app.post('/setLightState', function (req, res) {
    let context = createContext(req)
    let span = createSpan(req, context)
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
}
