/* jshint node: true */
'use strict';

var models = require('../../bin/models');

var dataProvider = [
  {
    testSuiteData: {
      name: 'test-suite-name',
      timeStamp: '2014-07-31',
      hostName: 'localhost',
      packageName: 'package-name',
      id: 0
    },
    testCaseResult: {
      fullName: 'test-case-full-name',
      description: 'test-case-name',
      status: 'passed',
      failedExpectations: []
    },
    testCaseTime: 0.008,
    expectedSerializedTestSuite: '<testsuites><testsuite name="test-suite-name" package="package-name" ' +
      'timestamp="2014-07-31" id="0" hostname="localhost" tests="1" errors="0" failures="0" skipped="0" time="0.008">' +
      '<testcase classname="package-name.test-case-full-name" name="test-case-name" time="0.008"> </testcase></testsuite>' +
      '</testsuites>'
  },
  {
    testSuiteData: {
      name: 'test-suite-name',
      timeStamp: '2014-07-31',
      hostName: 'localhost',
      packageName: 'package-name',
      id: 0
    },
    testCaseResult: {
      fullName: 'test-case-full-name',
      description: 'test-case-name',
      status: 'error',
      failedExpectations: [
        {
          stack: 'backtrace'
        }
      ]
    },
    testCaseTime: 0.008,
    expectedSerializedTestSuite: '<testsuites><testsuite name="test-suite-name" package="package-name" ' +
      'timestamp="2014-07-31" id="0" hostname="localhost" tests="1" errors="1" failures="0" skipped="0" ' +
      'time="0.008"><testcase classname="package-name.test-case-full-name" name="test-case-name" time="0.008"> ' +
      '<error message="test failure"><![CDATA[backtrace]]></error> </testcase></testsuite></testsuites>'
  },
  {
    testSuiteData: {
      name: 'test-suite-name',
      timeStamp: '2014-07-31',
      hostName: 'localhost',
      packageName: 'package-name',
      id: 0
    },
    testCaseResult: {
      fullName: 'test-case-full-name',
      description: 'test-case-name',
      status: 'failed',
      failedExpectations: [
        {
          stack: 'backtrace'
        }
      ]
    },
    testCaseTime: 0.008,
    expectedSerializedTestSuite: '<testsuites><testsuite name="test-suite-name" package="package-name" ' +
      'timestamp="2014-07-31" id="0" hostname="localhost" tests="1" errors="0" failures="1" skipped="0" time="0.008">' +
      '<testcase classname="package-name.test-case-full-name" name="test-case-name" time="0.008"> <failure message="test failure">' +
      '<![CDATA[backtrace]]></failure> </testcase></testsuite></testsuites>'
  },
  {
    testSuiteData: {
      name: 'test-suite-name',
      timeStamp: '2014-07-31',
      hostName: 'localhost',
      packageName: 'package-name',
      id: 0
    },
    testCaseResult: {
      fullName: 'test-case-full-name',
      description: 'test-case-name',
      status: 'pending',
      failedExpectations: []
    },
    testCaseTime: 0.008,
    expectedSerializedTestSuite: '<testsuites><testsuite name="test-suite-name" package="package-name" ' +
      'timestamp="2014-07-31" id="0" hostname="localhost" tests="1" errors="0" failures="0" skipped="1" time="0.008">' +
      '<testcase classname="package-name.test-case-full-name" name="test-case-name" time="0.008"> <skipped></skipped> </testcase>' +
      '</testsuite></testsuites>'
  }
];

dataProvider.forEach(function (data) {
  describe('test initializing the models', function () {
    var result;
    beforeEach(function () {
      result = commonSetup(data);
    });

    it('should have the appropriate serialized test suite', function () {
      expect(data.expectedSerializedTestSuite).toEqual(result.actualSerializedTestSuite);
    });
  });
});

describe('testing getIssueType without parameter', function () {
  var result, issueCount;
  beforeEach(function () {
    result = commonSetup(dataProvider[2]);

    // Call getIssueCount and get the default issue count
    issueCount = result.testSuite.getIssueCount();
  });

  it('should have a failure count of 1', function () {
    expect(issueCount).toEqual(1);
  });
});

describe('test adding an object to the TestSuite instead of a TestCase', function () {
  var testSuite;
  var data = dataProvider[0];

  beforeEach(function () {
    testSuite = new models.TestSuite(data.testSuiteData.name, data.testSuiteData.timeStamp,
      data.testSuiteData.hostName, data.testSuiteData.packageName, data.testSuiteData.id);
    testSuite.addTestCase(data.testCaseResult);
  });

  it('should not have any test cases in the test suite', function () {
    expect(testSuite.getTestCount()).toEqual(0);
  });
});

function commonSetup(data) {
  var testSuite, testCase, actualSerializedTestSuite;

  testSuite = new models.TestSuite(data.testSuiteData.name, data.testSuiteData.timeStamp,
    data.testSuiteData.hostName, data.testSuiteData.packageName, data.testSuiteData.id);

  testCase = new models.TestCase(data.testCaseResult, data.testCaseTime, data.testSuiteData.packageName);

  // Add the test case to the test suite
  testSuite.addTestCase(testCase);
  actualSerializedTestSuite = testSuite.getSerialized();

  return {
    actualSerializedTestSuite: actualSerializedTestSuite,
    testSuite: testSuite,
    testCase: testCase
  };
}
