'use strict'

let bodyParser = require('body-parser')
let triggerAlarm = require('../handlers/triggerAlarm.js')
let createSpan = require('../common/createSpan.js')
let createContext = require('../common/createContext.js')
let _ = require('lodash')

module.exports = function (app) {
  app.use(bodyParser.text()) // Blue Iris can only send the body as text, not json.
  app.post('/triggerAlarm', function (req, res) {
    // convert text body into JS object
    let bodyParts = req.body.split('&')
    let body = {}
    _.forEach(bodyParts, function (prop) {
      let propParts = prop.split('=')
      // convert rooms value into an array splitting on the comma
      if (propParts[0] === 'rooms') {
        propParts[1] = propParts[1].split(',')
      }
      body[propParts[0]] = propParts[1]
    })
    req.body = body
    let context = createContext(req)
    context.span = createSpan(req, context)

    if (!body.apikey) {
      res.statusCode = 400
      res.send('Must specify apikey in body.')
    }

    if (!body.hueip) {
      res.statusCode = 400
      res.send('Must specify hueip in body.')
    }

    if (!body.rooms.length || !Array.isArray(body.rooms)) {
      res.statusCode = 400
      res.send('Must specify rooms')
    }

    if (res.statusCode !== 200) {
      return res
    }

    return triggerAlarm(req, context)
    .then(function (response) {
      context.span.addTags({
        httpResponse: 200
      })
      context.span.finish()
      res.status(200).send(response)
    })
  })
}
