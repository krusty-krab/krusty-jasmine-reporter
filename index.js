/* jshint node: true */
'use strict';

var format = require('util').format;
var models = require('./bin/models');
var Wiretree = require('wiretree');
var prettyData = require('pretty-data').pd;
var os = require('os');
var Promise = require('promise');
var fsWriteThen = Promise.denodeify(require('fs').writeFile);

// Inject Dependencies
var wireTree = new Wiretree(__dirname);
wireTree.add(format, 'format');
wireTree.add(models, 'models');
wireTree.add(prettyData, 'prettyData');
wireTree.add(os, 'os');
wireTree.add(fsWriteThen, 'fsWriteThen');
wireTree.add(new jasmine.Timer(), 'timer');
wireTree.add(new jasmine.Timer(), 'specTimer');
wireTree.add(new Date(), 'date');
wireTree.load('./bin/reporter.js', 'reporter');

// Export the Krusty Jasmine JUnit Reporter
module.exports = wireTree.get('reporter');
