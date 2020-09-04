const express = require('express')
const Responses = require('./responses')

class MockApi {
  constructor(config = {}) {
    const responses = new Responses(config)
    this.responses = responses
    this.router = express.Router()
    this.useTimeout = config.useTimeout || false
    this.timeout = config.timeout || 0

    const self = this

    this.router.post(responses.apiEndpointBase + '*/set/:code', function(
      req,
      res
    ) {
      responses.configureResponse(req, res)
    })

    this.router.all(responses.apiEndpointBase + '*/clear/:code', function(
      req,
      res
    ) {
      responses.clearResponse(req, res)
    })

    this.router.get(responses.apiEndpointBase + 'clearall', function(req, res) {
      responses.clearAll(req, res)
    })

    this.router.all(responses.apiEndpointBase + '*', function(req, res) {
      if (self.useTimeout) {
        setTimeout(function() {
          self.submit(req, res)
        }, self.timeout)
      } else {
        self.submit(req, res)
      }
    })
  }

  submit(req, res) {
    res.set('Cache-Control', 'no-cache')
    console.log('mock api: ', req.url, this.responses.httpMethod(req))
    return this.responses.respond(req, res)
  }
}

module.exports = MockApi
