/* jshint node: true */
'use strict';

var prettyData = require('pretty-data').pd;
var os = require('os');
var fs = require('fs');
var format = require('util').format;
var models = require('./models');

/**
 * The KrustyJasmineJUnitReporter is a Jasmine reporter that is used to generate an XML data format representing
 * the Jasmine test results. This reporter will be used to generate an XML file that will be read and interpreted
 * by Jenkins.
 * @param {Object} options
 * @constructor
 */
function KrustyJasmineJUnitReporter (options) {
  var testSuite;

  var specTimer = options.specTimer;

  /**
   * Called when the Jasmine process is started. Variables and the TestSuite are initialized here.
   */
  this.jasmineStarted = function jasmineStarted () {
    testSuite = new models.TestSuite(options.JUnitReportSuiteName, new Date().toISOString(), os.hostname(),
      options.JUnitReportPackageName, 0);
  };

  /**
   * Called when the jasmine process is finished. At this point, the data can be serialized and output to a file.
   */
  this.jasmineDone = function jasmineDone () {
    if (options.JUnitReportSavePath && options.JUnitReportFilePrefix) {
      var report = prettyData.xml(testSuite.getSerialized());
      var filePath = options.JUnitReportSavePath + options.JUnitReportFilePrefix + '.xml';

      try {
        fs.writeFileSync(filePath, report);
      } catch(e) {
        console.error(e);
        throw e;
      }
      console.log('Wrote report file to ', filePath);
    }
  };

  /**
   * Called when a spec is started. The only thing needed to be done here is to start the spec timer.
   */
  this.specStarted = specTimer.start.bind(specTimer);

  /**
   * Called when a spec completes. In this callback, the time it took to run the test case is recorded and a new
   * TestCase model is instantiated with that time. The new test case is then added to the test suite.
   * @param {Object} result
   */
  this.specDone = function specDone (result) {
    var seconds = specTimer.elapsed() / 1000;
    var testCase = new models.TestCase(result, seconds, options.JUnitReportPackageName);
    testSuite.addTestCase(testCase);
  };
}

module.exports = {
  KrustyJasmineJUnitReporter: KrustyJasmineJUnitReporter
};
