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
    let headers = req.headers
    context.span = createSpan(req, context)

    if (!headers.apikey) {
      res.statusCode = 400
      res.send('Must specify apikey in headers.')
    }

    if (!headers.hueip) {
      res.statusCode = 400
      res.send('Must specify hueip in headers.')
    }

    if (res.statusCode !== 200) {
      return res
    }

    return getLights(req, context)
    .then(function(response) {
      if (response) {
        context.span.addTags({
          httpResponse: 200
        })
        context.span.finish()
        res.status(200).send({
          success: true
        })
      }
      res.status(500).send()
    })
    .catch(function(error) {
      context.span.addTags({
        error: true,
        errorDetails: error
      })
      context.span.finish()
      res.status(error.statusCode || 500).send(error.message)
    })
  })
};