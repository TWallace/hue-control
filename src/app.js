'use strict'

let express = require('express')
let app = express()
let uuid = require('node-uuid')
let tracer = require('ctrace-js')
let bodyParser = require('body-parser')
let getLights = require('./handlers/getLights.js')
let setLightState = require('./handlers/setLightState.js')
let PORT = process.env.port || 3001
let context

tracer.init({
  propagators: {     // custom propagators mapped to format type
    [tracer.FORMAT_HTTP_HEADERS]: [
      {
        extract: (correlationId) => {
          if (correlationId && typeof correlationId === 'string') {
            return {
              traceId: correlationId,
              spanId: correlationId
            }
          } else {
            return {
              traceId: uuid.v4(),
              spanId: uuid.v4()
            }
          }
        }
      }
    ]
  }
})

app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())
app.use(tracer.express())
app.set('port', process.env.port || PORT)

function createSpan(req) {
  context = tracer.extract(tracer.FORMAT_HTTP_HEADERS, req.headers)
  return tracer.startSpan('GetLights', {
    childOf: context,
    tags: {
      'spanKind': 'server',
      'peeriIpv4': req.ip,
      'httpMethod': req.method,
      'httpUrl': req.url
    }
  })
}

app.get('/getLights', function(req, res) {
  let span = createSpan(req)
  return getLights(req, context)
  .then(function(response) {
    if (response) {
      span.addTags({
        httpResponse: 200
      })
      span.finish()
      res.status(200).send(response)
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

app.post('/setLightState', function (req, res) {
  let span = createSpan(req)
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

app.use('/docs', express.static(__dirname + '/../docs'))

app.use(function (req, res) {
  res.status(404).send('File Not Found')
})

app.use(function (error, req, res) {
  res.status(505).send('Internal Server Error')
})

app.listen(app.get('port'), function () {
  console.log(`Hue Control listening on port ${PORT}`)
})