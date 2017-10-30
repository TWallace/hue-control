'use strict';

/**
 * @api {post} /getLights Get Lights
 * @apiName Get Lights
 * @apiGroup Lights
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 */

let getLights = require('../handlers/getLights.js')
let createSpan = require('../common/createSpan.js')
let createContext = require('../common/createContext.js')

module.exports = function(app) {
  app.get('/getLights', function(req, res) {
    let context = createContext(req)
    let span = createSpan(req, context)
    return getLights(req, context)
    .then(function(response) {
      if (response) {
        span.addTags({
          httpResponse: 200
        })
        span.finish()
        res.status(200).send({
          success: true
        })
      }
      res.status(500).send()
    })
    .catch(function(error) {
      span.addTags({
        error: true,
        errorDetails: error
      })
      span.finish()
      res.status(error.statusCode || 500).send(error.message)
    })
  })
};