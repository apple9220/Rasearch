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
var fs = require('fs');
var path = require('path'); 

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

    // Scrape & Export CSV
    app.post('/scrapeCSV', function(req, res) {        
        const execFile = require('child_process').execFile;
        const child = execFile('node', ['./crawl.js'], (error, stdout, stderr) => {
            if (error) {
                console.error('stderr', stderr);                
                throw error;
            }
            console.log('stdout', stdout);        
        });
        res.send(JSON.stringify('success'));
    });

    // Remove File
    app.post('/removeFile', function(req, res) {        
        var filePath = req.body.fileName; 
        fs.unlink(filePath, function(err) {
            if (err) res.send('Remove File Faild');
            res.send('Remove File Success');
        });          
    });

    // Check File
    app.post('/checkFile', function(req, res) {        
        var filePath = req.body.fileName;   
        
        fs.stat(path.join(path.resolve('.', 'public/'), filePath), function (err, stat) {
            if (err == null) {
                console.log("file already exists"); //only prints console message
                res.send(JSON.stringify('exist'));                
            } else {
                res.send(JSON.stringify('not'));                
            }
        });      
    });
    // NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
    // app.get('/protected', middleware.requireUser, routes.views.protected);
};