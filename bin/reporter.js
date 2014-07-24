/* jshint node: true */
'use strict';

/**
 * The Krusty Jasmine JUnit Reporter Module
 * @param {Object} models
 * @param {Object} prettyData
 * @param {Object} os
 * @param {Function} fsWriteThen
 * @param {jasmine.Timer} timer
 * @param {jasmine.Timer} specTimer
 * @param {Date} date
 * @returns {Object}
 */
exports.wiretree = function krustyJasmineReporterModule(models, prettyData, os, fsWriteThen, timer, specTimer, date) {

  /**
   * The KrustyJasmineJUnitReporter is a Jasmine reporter that is used to generate an XML data format representing
   * the Jasmine test results. This reporter will be used to generate an XML file that will be read and interpreted
   * by Jenkins.
   * @param {Object} options
   * @constructor
   */
  function KrustyJasmineJUnitReporter(options) {
    var testSuite;

    /**
     * Called when the Jasmine process is started. Variables and the TestSuite are initialized here.
     * @param {Object} specInfo
     */
    this.jasmineStarted = function jasmineStarted(specInfo) {
      testSuite = new models.TestSuite(options.JUnitReportSuiteName, date.toISOString(), os.hostname(),
        options.JUnitReportPackageName, 0);
      timer.start();
    };

    /**
     * Called when the jasmine process is finished. At this point, the data can be serialized and output to a file.
     */
    this.jasmineDone = function jasmineDone(done) {
      var report = prettyData.xml(testSuite.getSerialized());
      var seconds = timer.elapsed() / 1000;
      var totalErrors = testSuite.getIssueCount(models.FAILED) + testSuite.getIssueCount(models.ERROR) +
        testSuite.getIssueCount(models.PENDING);
      var completed = options.done || function () {};
      done = done || function () {};

      console.log('finished in ', seconds, ' seconds');

      if (options.JUnitReportSavePath && options.JUnitReportFilePrefix) {
        fsWriteThen(options.JUnitReportSavePath + options.JUnitReportFilePrefix + ".xml", report, 'utf8')
          .then(function () {
            console.log('Wrote report file to ', options.JUnitReportSavePath + options.JUnitReportFilePrefix + ".xml");
            completed(totalErrors === 0);
          })
          .catch(function (e) {
            console.log('Error writing Jasmine Reports to ', options.JUnitReportSavePath +
              options.JUnitReportFilePrefix + ".xml", e);
            completed(false);
          }).done(done);
      } else {
        completed(totalErrors === 0);
        done();
      }
    };

    /**
     * Called when a spec is started. The only thing needed to be done here is to start the spec timer.
     */
    this.specStarted = function specStarted () {
      specTimer.start();
    };

    /**
     * Called when a spec completes. In this callback, the time it took to run the test case is recorded and a new
     * TestCase model is instantiated with that time. The new test case is then added to the test suite.
     * @param {Object} result
     */
    this.specDone = function specDone (result) {
      var seconds = specTimer.elapsed() / 1000;
      var testCase = new models.TestCase(result, seconds);
      testSuite.addTestCase(testCase);
    };
  }

  return {
    KrustyJasmineJUnitReporter: KrustyJasmineJUnitReporter
  };
};
