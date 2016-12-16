/// <reference path="../typings/node.d.ts" />
"use strict";
const key_value_store_1 = require("./endpoint-handlers/key-value-store");
const debug = require('debug')('app:main');
const nconf = require('nconf');
const db_1 = require('../common/db');
////////////////////////////////////////////////////////////////////////////////
//
// Configuration
//
////////////////////////////////////////////////////////////////////////////////
nconf.argv().env().defaults({
    'port': 3005,
    'database': 'mongodb://localhost/sl'
});
const port = nconf.get('port');
const databaseUri = nconf.get('database');
debug('port: ' + port);
debug('database URI: ' + databaseUri);
////////////////////////////////////////////////////////////////////////////////
//
// Set up web server.
//
////////////////////////////////////////////////////////////////////////////////
const express = require('express'); // call express
const cors = require('cors');
const app = express(); // define our app using express
const bodyParser = require('body-parser');
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Test route to make sure everything is working.
app.get('/', (req, res) => res.json({ message: 'Hello World' }));
////////////////////////////////////////
//
//  Key/Value Store
//
////////////////////////////////////////
const keyValueStore = new key_value_store_1.KeyValueStore(db_1.database);
app.delete('/api/store/:key', keyValueStore.deleteHandler);
app.get('/api/store', keyValueStore.listHandler);
app.get('/api/store/:key', keyValueStore.getHandler);
app.post('/api/store/:key', keyValueStore.postHandler);
////////////////////////////////////////////////////////////////////////////////
//
// Start everything
//
////////////////////////////////////////////////////////////////////////////////
db_1.database.uri = databaseUri;
db_1.database.connect()
    .then(() => {
    debug('Connected to the database at ' + databaseUri);
    app.listen(port);
})
    .catch((error) => debug("Failed to connect to the database at " + databaseUri, error));
//# sourceMappingURL=app.js.map