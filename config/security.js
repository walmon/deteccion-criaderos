/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// security.js
var rateLimit = require('express-rate-limit');
var csrf = require('csurf');
var helmet = require('helmet');

module.exports = function(app) {
  app.enable('trust proxy');

  // 1. helmet with some customizations
  var cspReportUrl = '/report-csp-violation';
  var siteAllowedToIframeThis = 'https://watson-experience.mybluemix.net/';
  app.use(helmet({
    cacheControl: false,
    frameguard: {
      action: 'allow-from',
      domain: siteAllowedToIframeThis
    },
    contentSecurityPolicy: {
      // Specify directives as normal.
      directives: {
        defaultSrc: ["'self'"], // default value for unspecified directives that end in -src
        scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com/'], // jquery cdn, etc. try to avid "'unsafe-inline'"
        //styleSrc: ["'self'"], // no inline css
        imgSrc: ['*', 'data:'], // should be "'self'" and possibly 'data:' for most apps, but vr demo loads random user-supplied image urls, and apparently * doesn't include data: URIs
        connectSrc: ["'self'", '*.watsonplatform.net', ' https://collector.tealeaf.ibmcloud.com/'], // ajax domains
        //fontSrc: ["'self'"], // cdn?
        objectSrc: [], // embeds (e.g. flash)
        //mediaSrc: ["'self'", '*.watsonplatform.net'], // allow watson TTS streams
        childSrc: [], // child iframes
        frameAncestors: [siteAllowedToIframeThis], // parent iframes
        formAction: ["'self'"], // where can forms submit to
        pluginTypes: [], // e.g. flash, pdf
        //sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin'], // options: allow-forms allow-same-origin allow-scripts allow-top-navigation
        reportUri: cspReportUrl,
      },

      // Set to true if you only want browsers to report errors, not block them.
      // You may also set this to a function(req, res) in order to decide dynamically
      // whether to use reportOnly mode, e.g., to allow for a dynamic kill switch.
      reportOnly: false,

      // Set to true if you want to blindly set all headers: Content-Security-Policy,
      // X-WebKit-CSP, and X-Content-Security-Policy.
      setAllHeaders: false,

      // Set to true if you want to disable CSP on Android where it can be buggy.
      disableAndroid: false,

      // Set to false if you want to completely disable any user-agent sniffing.
      // This may make the headers less compatible but it will be much faster.
      // This defaults to `true`.
      browserSniff: true
    }
  }));
  // endpoint to report CSP violations
  app.post(cspReportUrl, function(req, res) {
    console.log('Content Security Policy Violation:\n', req.body);
    res.status(204).send(); // 204 = No Content
  });

  // 2. rate-limit to /api/
  app.use('/api/', rateLimit({
    windowMs: 30 * 1000, // seconds
    delayMs: 0,
    max: 10
  }));

  // 3. csrf
  var csrfProtection = csrf({
    cookie: true
  });

  app.get('/*', csrfProtection, function(req, res, next) {
    res.locals = {
      ga: process.env.GOOGLE_ANALYTICS,
      ct: req.csrfToken()
    };
    next();
  });

};
