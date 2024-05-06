#!/usr/bin/env node
var prerender = require('./lib');

var server = prerender({
  pageLoadTimeout: 5 * 1000,
  chromeLocation: '/usr/bin/chromium',
  chromeFlags: ['--disable-extensions', '--no-sandbox', '--headless', '--disable-gpu', '--disable-software-rasterizer', '--hide-scrollbars', '--remote-debugging-port=9222 ', '--skip-js-errors']
});


var cacheManager = require('cache-manager');

cache = {
        init: function() {
                this.cache = cacheManager.caching({
                        store: 'memory', max: process.env.CACHE_MAXSIZE || 100, ttl: process.env.CACHE_TTL || 60/*seconds*/
                });
        },

        requestReceived: function(req, res, next) {
                this.cache.get(req.prerender.url, function (err, result) {
                        if (!err && result && req.prerender.userAgent != 'SYNCTUM') {
                                req.prerender.cacheHit = true;
                                res.send(200, result);
                        } else {
                                next();
                        }
                });
        },

        beforeSend: function(req, res, next) {
                if (!req.prerender.cacheHit && req.prerender.statusCode == 200) {
                        this.cache.set(req.prerender.url, req.prerender.content);
                }
                next();
        }
};

server.use(cache)
//server.use(require('prerender-api'))
server.use(prerender.sendPrerenderHeader());
server.use(prerender.browserForceRestart());
// server.use(prerender.blockResources());
server.use(prerender.addMetaTags());
server.use(prerender.removeScriptTags());
server.use(prerender.httpHeaders());


server.start();
