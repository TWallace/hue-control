'use strict'

let http = require('request-promise')
let _ = require('lodash')
let tracer = require('ctrace-js')

// Use Hue API to set room state: https://developers.meethue.com/documentation/groups-api#25_set_group_state
// turn on to specified brightness
// set timeout to turn lights back off (or to previous state?)
function triggerRoomLight(request, context) {
  let headers = request.headers
  let body = request.body
  let options = {
    method: 'PUT',
    uri: `http://${headers.hueip}/api/${headers.apikey}/groups/${body.room.id}/action`,
    body: {
      on: true,
      bri: 254 // 0-254
      // TODO: if bulbs are color, specify a white hue
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

module.exports = triggerRoomLight
