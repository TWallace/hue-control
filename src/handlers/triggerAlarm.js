'use strict'

let http = require('request-promise')
let _ = require('lodash')
let tracer = require('ctrace-js')
let getRoomLightState = require('../common/getRoomLightState.js')
let getRooms = require('../common/getRooms.js')
let revertLightState = require('../common/revertLightState.js')
let Promise = require('bluebird')
let timeout
let ALARM_END = 30000 // five minutes

function triggerRoomLight(request, context) {
  let body = request.body
  let options = {
    method: 'PUT',
    uri: `http://${body.hueip}/api/${body.apikey}/groups/${body.room.id}/action`,
    body: {
      on: true,
      bri: 254, // 0-254
      xy: [0.35, 0.3]
    },
    json: true,
    traceContext: context
  }
  return http.put(options)
  .then(function(response) {
    if (_.get(response, '[0].error')) {
      throw response[0].error
    }
    tracer.info(context, `Successfully turned lights on in ${body.room.name}`)
  })
  .catch(function (error) {
    console.error('Unable to update room lights:', JSON.stringify(error))
  })
}

function triggerAlarm (req, context) {
  let body = req.body
  // first get rooms using body.rooms array to get the ids of those rooms
  return getRooms(req, context)
  .then(function (response) {
    let filteredRooms = []
    body.filteredRooms = _.filter(body.rooms, function (room) {
      let matchedRoom = _.find(response, {name: room})
      if (!matchedRoom) {
        throw new Error(`${room} is an invalid room name`)
      } else {
        filteredRooms.push({
          name: room,
          id: matchedRoom.id
        })
      }
    })
    return Promise.map(filteredRooms, function (room) {
      return getRoomLightState({
        body,
        groupId: room.id
      }, context)
      .then(function (lights) {
        room.lights = lights
        body.room = room
        return triggerRoomLight(req, context)
        .then(function () {
          timeout = setTimeout(function () {
            return revertLightState(req, room.lights)
          }, ALARM_END)
        })
        .catch(function (error) {
          context.span.addTags({
            error: true,
            errorDetails: error
          })
        })
      })
    })
  })
}

module.exports = triggerAlarm
