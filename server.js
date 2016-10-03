#! /usr/bin/env node
'use strict';

require('dotenv').config({silent: true});

if (process.env.GOOGLE_ANALYTICS) {
  process.env.GOOGLE_ANALYTICS = process.env.GOOGLE_ANALYTICS.replace(/\"/g, '');
}
if (process.env.API_KEY) {
  process.env.API_KEY = process.env.API_KEY.replace(/\"/g, '');
}

// Deployment tracking
require('cf-deployment-tracker-client').track();

var server = require('./app');
var port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;

server.listen(port, function() {
  console.log('Server running on port: %d', port);
});
