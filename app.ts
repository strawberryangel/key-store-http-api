/// <reference path="../typings/node.d.ts" />

import {KeyValueStore} from "./endpoint-handlers/key-value-store"
const debug = require('debug')('app:main')
const nconf = require('nconf')

import {database} from '../common/db'
import {AuthorizationHandler} from "./endpoint-handlers/authorization-handler"

////////////////////////////////////////////////////////////////////////////////
//
// Configuration
//
////////////////////////////////////////////////////////////////////////////////

nconf.argv().env().defaults({
    'port': 3005,
    'database': 'mongodb://localhost/sl'
})

const port = nconf.get('port')
const databaseUri = nconf.get('database')

debug('port: ' + port)
debug('database URI: ' + databaseUri)

////////////////////////////////////////////////////////////////////////////////
//
// Set up web server.
//
////////////////////////////////////////////////////////////////////////////////

const express = require('express')          // call express
const cors = require('cors')
const app = express()                       // define our app using express
const bodyParser = require('body-parser')

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(cors())
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

// Test route to make sure everything is working.
app.get('/', (req, res) => res.json({message: 'Hello World'}))

////////////////////////////////////////
//
//  Key/Value Store
//
////////////////////////////////////////

const keyValueStore: KeyValueStore = new KeyValueStore(database)
app.delete('/api/store/:key', keyValueStore.deleteHandler)
app.get('/api/store', keyValueStore.listHandler)
app.get('/api/store/:key', keyValueStore.getHandler)
app.post('/api/store/:key', keyValueStore.postHandler)


const authorizationHandler: AuthorizationHandler = new AuthorizationHandler(database)
app.post('/api/authorization/get-handshake-code', authorizationHandler.postGetHandshakeCode)

////////////////////////////////////////////////////////////////////////////////
//
// Start everything
//
////////////////////////////////////////////////////////////////////////////////

database.uri = databaseUri
database.connect()
    .then(() => {
        debug('Connected to the database at ' + databaseUri)
        app.listen(port)
    })
    .catch((error) => debug("Failed to connect to the database at " + databaseUri, error))


