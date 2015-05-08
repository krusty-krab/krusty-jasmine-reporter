/* jshint node: true */
'use strict';

var rewire = require('rewire');
var reporter = rewire('../../bin/reporter');

describe('test initializing the Krusty Jasmine Reporter Module', function () {
  var models, prettyData, os, testSuite, testCase,
    krustyJasmineJUnitReporter, options, specTimer, hostname,
    testSuiteSerialized, writeFileSync, revert;

  beforeEach(function () {
    hostname = 'localhost';
    testSuiteSerialized = 'serialized-test-suite';
    testSuite = {
      addTestCase: jasmine.createSpy('addTestCase'),
      getSerialized: jasmine.createSpy('getSerialized').and.returnValue(testSuiteSerialized)
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

    specTimer = jasmine.createSpyObj('specTimer', ['start', 'elapsed']);

    options = {
      specTimer: specTimer,
      JUnitReportSuiteName: 'Suite Name',
      JUnitReportPackageName: 'Package Name',
      JUnitReportSavePath: './',
      JUnitReportFilePrefix: 'results'
    };

    os.hostname.and.returnValue(hostname);

    writeFileSync = jasmine.createSpy('writeFileSync');

    revert = reporter.__set__({
      os: os,
      models: models,
      prettyData: prettyData,
      fs: {
        writeFileSync: writeFileSync
      },
      console: {
        log: function () {}
      }
    });

    krustyJasmineJUnitReporter = new reporter.KrustyJasmineJUnitReporter(options);
    krustyJasmineJUnitReporter.jasmineStarted({});
  });

  afterEach(function () {
    revert();
  });

  describe('test calling jasmineStarted', function () {
    it('should instantiate models.TestSuite with appropriate data', function () {
      expect(models.TestSuite).toHaveBeenCalledWith(options.JUnitReportSuiteName, jasmine.any(String), hostname,
        options.JUnitReportPackageName, 0);
    });

    it('should call os.hostname', function () {
      expect(os.hostname).toHaveBeenCalled();
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
      expect(models.TestCase).toHaveBeenCalledWith(result, 2, options.JUnitReportPackageName);
    });

    it('should call testSuite.addTestCase with the test case', function () {
      expect(testSuite.addTestCase).toHaveBeenCalledWith(testCase);
    });
  });

  describe('test calling jasmineDone and writing to output file without errors', function () {
    beforeEach(function () {
      initializeJasmineDoneMocks();
      krustyJasmineJUnitReporter.jasmineDone();
    });

    it('should call prettyData.xml', function () {
      expect(prettyData.xml).toHaveBeenCalledWith(testSuiteSerialized);
    });

    it('should call writeFileSync with appropriate values', function () {
      expect(writeFileSync).toHaveBeenCalledWith(options.JUnitReportSavePath + options.JUnitReportFilePrefix + ".xml",
        testSuiteSerialized);
    });
  });

  describe('test calling jasmineDone and writing to output file with errors', function () {
    beforeEach(function () {
      initializeJasmineDoneMocks();
      krustyJasmineJUnitReporter.jasmineDone();
    });
  });

  describe('test calling jasmineDone and catching an error while writing', function () {
    beforeEach(function () {
      initializeJasmineDoneMocks();
      krustyJasmineJUnitReporter.jasmineDone();
    });

    it('should call prettyData.xml', function () {
      expect(prettyData.xml).toHaveBeenCalledWith(testSuiteSerialized);
    });

    it('should call writeFileSync with appropriate values', function () {
      expect(writeFileSync).toHaveBeenCalledWith(options.JUnitReportSavePath + options.JUnitReportFilePrefix + ".xml",
        testSuiteSerialized);
    });
  });

  describe('test jasmineDone if the save path or file prefix have not been defined', function () {
    beforeEach(function () {
      initializeJasmineDoneMocks();
      delete options.JUnitReportSavePath;

      krustyJasmineJUnitReporter.jasmineDone();
    });

    it('should not call prettyData.xml', function () {
      expect(prettyData.xml).not.toHaveBeenCalled();
    });

    it('should NOT call writeFileSync', function () {
      expect(writeFileSync).not.toHaveBeenCalled();
    });
  });

  function initializeJasmineDoneMocks() {
    prettyData.xml.and.returnValue(testSuiteSerialized);
  }
});

