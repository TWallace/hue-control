'use strict'

let express = require('express')
let app = express()
let uuid = require('node-uuid')
let tracer = require('ctrace-js')
let bodyParser = require('body-parser')
let _ = require('lodash')
let routes = require('require-all')({
  dirname: __dirname + '/routes'
});
let PORT = process.env.port || 3001

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

_.forEach(routes, function (route) {
  route(app)
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