const express = require('express')
const MockApi = require('./src')
const path = require('path')
const opn = require('opn')

//Example with timeout
//Expects to find a mockapi directory with all your mock rest route folders and json response files
const mockapi = new MockApi({
  apiEndpoint: '/api',
  responsesDir: path.resolve('./example-responses/'),
  useTimeout: true,
  timeout: 2000
})

const app = express()
const port = process.env.PORT || 3000
app.use('/', mockapi.router)

app.listen(port, err => {
  if (err) throw err
  console.log(`> Ready on http://localhost:${port}/api/`)
  // opens the url in the default browser
  opn(`http://localhost:${port}/api/todos`)
  opn(`http://localhost:${port}/api/query?parameter=this`)
})
