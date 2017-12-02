'use strict'

let triggerAlarm = require('../handlers/triggerAlarm.js')
let createSpan = require('../common/createSpan.js')
let createContext = require('../common/createContext.js')


module.exports = function (app) {
  app.post('/triggerAlarm', function (req, res) {
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
