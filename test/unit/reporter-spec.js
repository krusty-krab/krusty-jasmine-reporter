/* jshint node: true */
'use strict';

var reporterModule = require('../../bin/reporter').wiretree;
var Promise = require('promise');

describe('test initializing the Krusty Jasmine Reporter Module', function () {
  var reporter, models, prettyData, os, fsWriteThen, testSuite, testCase, fsWriteThenPromise,
    krustyJasmineJUnitReporter, options, timer, specTimer, date, stubDate, hostname,
    testSuiteSerialized;

  beforeEach(function () {
    stubDate = '2014-07-31';
    hostname = 'localhost';
    testSuiteSerialized = 'serialized-test-suite';
    testSuite = {
      addTestCase: jasmine.createSpy('addTestCase'),
      getSerialized: jasmine.createSpy('getSerialized').and.returnValue(testSuiteSerialized),
      getIssueCount: jasmine.createSpy('getIssueCount').and.returnValue(0)
    };
    testCase = {};
    models = {
      TestSuite: jasmine.createSpy('TestSuite').and.returnValue(testSuite),
      TestCase: jasmine.createSpy('TestCase').and.returnValue(testCase),
      FAILED: 'failed',
      ERROR: 'error',
      PENDING: 'pending'
    };

    prettyData = jasmine.createSpyObj('prettyData', ['xml']);

    os = jasmine.createSpyObj('os', ['hostname']);

    fsWriteThenPromise = Promise.resolve();
    fsWriteThen = jasmine.createSpy('fsWriteThen').and.returnValue(fsWriteThenPromise);

    timer = jasmine.createSpyObj('timer', ['start', 'elapsed']);
    specTimer = jasmine.createSpyObj('specTimer', ['start', 'elapsed']);

    date = jasmine.createSpyObj('date', ['toISOString']);

    reporter = reporterModule(models, prettyData, os, fsWriteThen, timer, specTimer, date);

    options = {
      done: jasmine.createSpy('done'),
      JUnitReportSuiteName: 'Suite Name',
      JUnitReportPackageName: 'Package Name',
      JUnitReportSavePath: './',
      JUnitReportFilePrefix: 'results'
    };

    date.toISOString.and.returnValue(stubDate);
    os.hostname.and.returnValue(hostname);

    krustyJasmineJUnitReporter = new reporter.KrustyJasmineJUnitReporter(options);
    krustyJasmineJUnitReporter.jasmineStarted({});
  });

  it('should return an instance of KrustyJasmineJUnitReporter', function () {
    expect(reporter.KrustyJasmineJUnitReporter.name.toString()).toEqual('KrustyJasmineJUnitReporter');
  });

  describe('test calling jasmineStarted', function () {
    it('should instantiate models.TestSuite with appropriate data', function () {
      expect(models.TestSuite).toHaveBeenCalledWith(options.JUnitReportSuiteName, stubDate, hostname,
        options.JUnitReportPackageName, 0);
    });

    it('should call date.toISOString', function () {
      expect(date.toISOString).toHaveBeenCalled();
    });

    it('should call os.hostname', function () {
      expect(os.hostname).toHaveBeenCalled();
    });

    it('should call timer.start', function () {
      expect(timer.start).toHaveBeenCalled();
    });
  });

  describe('test calling specStarted', function () {
    beforeEach(function () {
      krustyJasmineJUnitReporter.specStarted();
    });

    it('should call specTimer.start', function () {
      expect(specTimer.start).toHaveBeenCalled();
    })
  });

  describe('test calling specDone', function () {
    var result;
    beforeEach(function () {
      result = {key: 'value'};
      specTimer.elapsed.and.returnValue(2000);
      models.TestCase.and.returnValue(testCase);
      krustyJasmineJUnitReporter.specDone(result);
    });

    it('should instantiate TestCase', function () {
      expect(models.TestCase).toHaveBeenCalledWith(result, 2);
    });

    it('should call testSuite.addTestCase with the test case', function () {
      expect(testSuite.addTestCase).toHaveBeenCalledWith(testCase);
    });
  });

  describe('test calling jasmineDone and writing to output file without errors', function () {
    beforeEach(function (done) {
      initializeJasmineDoneMocks();
      krustyJasmineJUnitReporter.jasmineDone(done);
    });

    it('should call prettyData.xml', function () {
      expect(prettyData.xml).toHaveBeenCalledWith(testSuiteSerialized);
    });

    it('should call getIssueCount with failed', function () {
      expect(testSuite.getIssueCount).toHaveBeenCalledWith(models.FAILED);
    });

    it('should call getIssueCount with error', function () {
      expect(testSuite.getIssueCount).toHaveBeenCalledWith(models.ERROR);
    });

    it('should call getIssueCount with pending', function () {
      expect(testSuite.getIssueCount).toHaveBeenCalledWith(models.PENDING);
    });

    it('should call fsWriteThen with appropriate values', function () {
      expect(fsWriteThen).toHaveBeenCalledWith(options.JUnitReportSavePath + options.JUnitReportFilePrefix + ".xml",
        testSuiteSerialized, 'utf8');
    });

    it('should call done with 0 errors', function () {
      expect(options.done).toHaveBeenCalledWith(true);
    });
  });

  describe('test calling jasmineDone and writing to output file with errors', function () {
    beforeEach(function (done) {
      testSuite.getIssueCount.and.callFake(function (issueType) {
        return (issueType === models.FAILED) ? 1 : 0;
      });

      initializeJasmineDoneMocks();
      krustyJasmineJUnitReporter.jasmineDone(done);
    });

    it('should call done with errors', function () {
      expect(options.done).toHaveBeenCalledWith(false);
    });
  });

  describe('test calling jasmineDone and catching an error while writing', function () {
    beforeEach(function (done) {
      initializeJasmineDoneMocks();
      fsWriteThenPromise = Promise.reject();
      fsWriteThen.and.returnValue(fsWriteThenPromise);

      krustyJasmineJUnitReporter.jasmineDone(done);
    });

    it('should call prettyData.xml', function () {
      expect(prettyData.xml).toHaveBeenCalledWith(testSuiteSerialized);
    });

    it('should call getIssueCount with failed', function () {
      expect(testSuite.getIssueCount).toHaveBeenCalledWith(models.FAILED);
    });

    it('should call getIssueCount with error', function () {
      expect(testSuite.getIssueCount).toHaveBeenCalledWith(models.ERROR);
    });

    it('should call getIssueCount with pending', function () {
      expect(testSuite.getIssueCount).toHaveBeenCalledWith(models.PENDING);
    });

    it('should call fsWriteThen with appropriate values', function () {
      expect(fsWriteThen).toHaveBeenCalledWith(options.JUnitReportSavePath + options.JUnitReportFilePrefix + ".xml",
        testSuiteSerialized, 'utf8');
    });

    it('should call done with 0 errors', function () {
      expect(options.done).toHaveBeenCalledWith(false);
    });
  });

  describe('test jasmineDone if the save path or file prefix have not been defined', function () {
    beforeEach(function (done) {
      initializeJasmineDoneMocks();
      delete options.JUnitReportSavePath;

      krustyJasmineJUnitReporter.jasmineDone(done);
    });

    it('should call prettyData.xml', function () {
      expect(prettyData.xml).toHaveBeenCalledWith(testSuiteSerialized);
    });

    it('should call getIssueCount with failed', function () {
      expect(testSuite.getIssueCount).toHaveBeenCalledWith(models.FAILED);
    });

    it('should call getIssueCount with error', function () {
      expect(testSuite.getIssueCount).toHaveBeenCalledWith(models.ERROR);
    });

    it('should call getIssueCount with pending', function () {
      expect(testSuite.getIssueCount).toHaveBeenCalledWith(models.PENDING);
    });

    it('should NOT call fsWriteThen', function () {
      expect(fsWriteThen).not.toHaveBeenCalled();
    });

    it('should call done with 0 errors', function () {
      expect(options.done).toHaveBeenCalledWith(true);
    });
  });

  describe('test calling jasmineDone without a done function in options', function () {
    beforeEach(function () {
      initializeJasmineDoneMocks();
      delete options.done;
      delete options.JUnitReportFilePrefix;

      krustyJasmineJUnitReporter.jasmineDone();
    });

    it('should complete without the done function', function () {
      expect(options.done).toBeUndefined();
    });

  });

  function initializeJasmineDoneMocks() {
    timer.elapsed.and.returnValue(2000);
    prettyData.xml.and.returnValue(testSuiteSerialized);
  }
});

