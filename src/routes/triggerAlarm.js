'use strict'

let triggerAlarm = require('../handlers/triggerAlarm.js')
let createSpan = require('../common/createSpan.js')
let createContext = require('../common/createContext.js')
let getRooms = require('../common/getRooms.js')
let Promise = require('bluebird')
let _ = require('lodash')
// let ALARM_END = 300000 // 5 minutes


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

    // first get rooms using body.rooms array to get the ids of those rooms
    return getRooms(req, context)
    .then(function (response) {
      let filteredRooms = []
      body.filteredRooms = _.filter(body.rooms, function (room) {
        let matchedRoom = _.find(response, { name: room })
        if (!matchedRoom) {
          res.statusCode = 400
          res.send(`${room} is an invalid room name`)
          return res
        } else {
          filteredRooms.push({
            name: room,
            id: matchedRoom.id
          })
        }
      })
      return Promise.map(filteredRooms, function (room) {
        req.body.room = room
        return triggerAlarm(req, context)
        .then(function (response) {
          context.span.addTags({
            httpResponse: 200
          })
          context.span.finish()
          res.status(200).send(response)
        })
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
