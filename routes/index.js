/**
 * This file is where you define your application routes and controllers.
 *
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre('routes') and pre('render') events.
 *
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 *
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 *
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 *
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */

var keystone = require('keystone');
var middleware = require('./middleware');
var importRoutes = keystone.importer(__dirname);
var crawl = require('../actions/crawl');

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

var URL = 'https://nvsos.gov/sosentitysearch/RACorps.aspx?fsnain=OQ%252fy6HT6QrwXv%252fzlehtQZw%253d%253d&RAName=INCORP+SERVICES%2c+INC.';
var CORINFOS = [];

// Import Route Controllers
var routes = {
    views: importRoutes('./views'),
};

// Setup Route Bindings
exports = module.exports = function(app) {
    // Views
    app.get('/', routes.views.index);

    // Scrape URL
    app.post('/scrapeURLS', function(req, res) {
        CORINFOS = [];        
        savedPayload = req.body.savedPayload;
        readCnt = req.body.readCnt;

        crawl.crawlUrls(URL, savedPayload, readCnt).then((response) => {
            res.send(JSON.stringify(response));
        }).catch((error) => {
            res.send(JSON.stringify("Scrapping Failed!"));
        })        
    });

    // Get Infos
    app.post('/getInfos', function(req, res) {
        url = req.body.url;

        crawl.crawlInfo(url).then((response) => {
            CORINFOS.push(response);
            res.send(JSON.stringify("success"));
        }).catch((error) => {            
            res.send(JSON.stringify("error"));
        })        
    });    

    // Export CSV
    app.post('/exportCSV', function(req, res) {
        console.log("CORINFOS's Length:= " + CORINFOS.length);
        crawl.exportCSV(CORINFOS).then((response) => {
            res.send(JSON.stringify("Scrapping Success!"));
        }).catch((error) => {
            res.send(JSON.stringify("Scrapping Failed!"));
        })        
    });   

    // Export ERROR
    app.post('/exportError', function(req, res) {    
        var errorURLS = req.body.data;    
        console.log('ErrorURL Length:= ' + errorURLS.length);
        crawl.exportError(errorURLS).then((response) => {
            res.send(JSON.stringify("Error Loging Completed!"));
        }).catch((error) => {
            res.send(JSON.stringify("Scrapping Failed!"));
        })        
    });

    
    // NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
    // app.get('/protected', middleware.requireUser, routes.views.protected);
};