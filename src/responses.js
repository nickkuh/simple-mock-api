const path = require('path')
const fs = require('fs')
const successHttpResponses = [200, 201, 202, 203, 204, 205, 206, 207, 208, 226]
const redirectHttpResponses = [302]

class Responses {
  constructor(config = {}) {
    this.apiEndpointBase = config.apiEndpoint || '/api'
    this.apiEndpointBase = this.apiEndpointBase + '/'
    this.responsesDir = config.responsesDir || path.resolve('../mockapi/')
    this.responseOverrides = {}
  }

  relativePath(req) {
    let arr = req.path.split(this.apiEndpointBase)
    let relativePath = arr[arr.length - 1]
    if (relativePath.indexOf('/set/') !== -1) {
      let arr2 = relativePath.split('/set/')
      return arr2[0]
    } else if (relativePath.indexOf('/clear/') !== -1) {
      let arr2 = relativePath.split('/clear/')
      return arr2[0]
    }
    return relativePath
  }

  httpMethod(req) {
    let httpMethod
    if (req.body && req.body.method !== undefined) {
      httpMethod = req.body.method.toLowerCase()
    } else {
      httpMethod = req.method.toLowerCase()
    }
    return httpMethod
  }

  responseKey(req) {
    //eg. user/password-post or user-get etc etc
    let relativePath = this.relativePath(req)
    let method = this.httpMethod(req)
    return `${relativePath}-${method}`
  }

  configureResponse(req, res) {
    let obj = req.body || {}
    obj.code = req.params.code
    this.responseOverrides[this.responseKey(req)] = obj
    res.status(200).json({})
  }

  clearResponse(req, res) {
    delete this.responseOverrides[this.responseKey(req)]
    res.status(200).json({})
  }

  clearAll(req, res) {
    this.responseOverrides = {}
    res.status(200).json({})
  }

  getOverrideObj(req) {
    let key = this.responseKey(req)
    if (this.responseOverrides[key]) {
      return this.responseOverrides[key]
    }
    return undefined
  }

  respond(req, res) {
    let method = this.httpMethod(req).toLowerCase()
    let relativePath = this.relativePath(req)
    let key = this.responseKey(req)
    let responseObj
    let code
    let filename
    if (this.responseOverrides[key]) {
      responseObj = this.responseOverrides[key]
      code = responseObj.code || 200
    } else {
      responseObj = {}
      code = 200
      //loop through until we find a success response code json response...
      let responseCodes = successHttpResponses.concat(redirectHttpResponses)
      for (let responseCode of responseCodes) {
        let file = path.join(
          this.responsesDir,
          relativePath,
          `${method}${responseCode}.json`
        )
        if (fs.existsSync(file)) {
          //found first match!
          code = responseCode
          break
        }
      }
    }
    filename = `${method}${code}`
    if (responseObj.suffix !== undefined) {
      filename += '-' + responseObj.suffix
    }

    let json = {}
    if (responseObj.json !== undefined) {
      try {
        json = JSON.parse(responseObj.json)
      } catch (error) {
        //malformed json
        json = responseObj.json
      }
    } else {
      let file = path.join(this.responsesDir, relativePath, `${filename}.json`)
      if (fs.existsSync(file)) {
        let contents = fs.readFileSync(file)

        if (
          (typeof contents === 'undefined' || contents.length == 0) &&
          code === 204
        ) {
          return res.status(code).json()
        }

        try {
          json = JSON.parse(contents)
        } catch (error) {
          //malformed json
          return res.status(code).json()
        }
      } else {
        //no mock file found
        if (code === 200) {
          return res.status(404).json()
        }
      }
    }

    if (code == 302) {
      res.set('Location', '/portal')
      return res.status(302).send('Found')
    }

    if (code > 0 && code < 600) {
      return res.status(code).json(json)
    } else {
      return res.status(500).json(json)
    }
  }
}

module.exports = Responses
