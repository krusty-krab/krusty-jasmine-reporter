/* jshint node: true */
'use strict';

/**
 * The module containing models used by the krutsty jasmine reporter
 * @param {util.format} format
 * @returns {Object}
 */
exports.wiretree = function krustyJasmineReporterModelsModule(format) {
  var ERROR = 'error';
  var FAILED = 'failed';
  var PENDING = 'pending';

  /**
   * TestSuite is a model that represents the contents inside of the <testsuite> node in the xml file. The constructor
   * receives the base properties. TestCases are added to the test suite as the tests are being ran. When completed,
   * there is a getSerialized method that will return an xml representation of the data.
   * @param {String} name
   * @param {String} timeStamp ISO 8601 representation of the date and time
   * @param {String} hostName
   * @param {String} packageName
   * @param {Number} id
   * @constructor
   */
  function TestSuite(name, timeStamp, hostName, packageName, id) {
    this.testCases = [];
    this.name = name;
    this.timeStamp = timeStamp;
    this.hostName = hostName;
    this.package = packageName;
    this.id = id;
  }

  /**
   * Adds a test case to the list of test cases.
   * @param {TestCase} testCase
   */
  TestSuite.prototype.addTestCase = function addTestCase(testCase) {
    if (testCase && testCase instanceof TestCase) {
      this.testCases.push(testCase);
    }
  };

  /**
   * Calculates how long it took to run all of the test cases for the suite.
   * @returns {String}
   */
  TestSuite.prototype.getTime = function getTime() {
    return this.testCases.reduce(getSumOfTestCaseTimes, 0).toFixed(3);

    /**
     * Calculates the sum of all test case times.
     * @param {TestCase} prevTestCase
     * @param {TestCase} currentTestCase
     * @returns {Number}
     */
    function getSumOfTestCaseTimes(prevTestCase, currentTestCase) {
      return prevTestCase + currentTestCase.time;
    }
  };

  /**
   * Returns the number of test cases run for the suite.
   * @returns {Number}
   */
  TestSuite.prototype.getTestCount = function getTestCount() {
    return this.testCases.length;
  };

  /**
   * Return the issue count. Valid issues include ['error'], ['failed'], ['pending'].
   * @param {String} [issueType] 'error', 'failed', or 'pending'. Defaults to 'failed'.
   * @returns {Number}
   */
  TestSuite.prototype.getIssueCount = function getFailureCount(issueType) {
    // default to failed if nothing is passed
    if (!issueType) {
      issueType = FAILED;
    }

    return this.testCases.filter(statusCountFilter).length;

    /**
     * Increments failure count
     * @param {Number} prevTestCase
     * @param {TestCase} currentTestCase
     * @returns {Number}
     */
    function statusCountFilter(currentTestCase) {
      return currentTestCase.status === issueType;
    }
  };

  /**
   * Serializes the data in the test suite into the proper format that can be read by Jenkins. Here is an example of
   * the data that might be returned.
   *
   * <testsuites>
   *   <testsuite name="My Reporter" package="My Reporter Package" timestamp="2014-07-23T22:40:18.211Z" id="0"
   *     hostname="localhost" tests="256" errors="0" failures="0" skipped="0" time="0.893">
   *     <testcase classname="integration tests basic" name="should receive a 200" time="0.047"></testcase>
   *   </testsuite>
   * </testsuites>
   *
   * @returns {String}
   */
  TestSuite.prototype.getSerialized = function getSerialized() {
    var serializedTestCases = this.testCases.reduce(serializeTestCase, '');
    return format(
        '<testsuites><testsuite name="%s" package="%s" timestamp="%s" id="%s" hostname="%s" tests="%s" errors="%s" ' +
        'failures="%s" ' + 'skipped="%s" time="%s">%s</testsuite></testsuites>',
      this.name, this.package, this.timeStamp, this.id, this.hostName, this.getTestCount(), this.getIssueCount(ERROR),
      this.getIssueCount(FAILED), this.getIssueCount(PENDING), this.getTime(), serializedTestCases);

    /**
     * Used by the reduce function, this will concatenate the previous accumulated string with the current serialized
     * test case. This is effectively used to concatenate all the serialized test cases together.
     * @param {String} prevTestCase
     * @param {TestCase} currentTestCase
     * @returns {String}
     */
    function serializeTestCase(prevTestCase, currentTestCase) {
      return prevTestCase + currentTestCase.getSerialized();
    }
  };

  /**
   * TestCase is a model that represents the data in a single test case.
   * @param {Object} result
   * @param {Number} time The time it took to run the test. An example would be, "0.800"
   * @constructor
   */
  function TestCase(result, time) {
    this.classname = result.fullName.substr(0, result.fullName.indexOf(result.description) - 1) || result.fullName;
    this.name = result.description;
    this.time = time;
    this.status = result.status;
    this.result = result;
  }

  /**
   * Returns a serialized version of the test case data. An example might be:
   *
   * <testcase classname="integration tests basic" name="should receive a 200" time="0.047"></testcase>
   *
   * @returns {String}
   */
  TestCase.prototype.getSerialized = function () {
    var testCaseMessage = format.bind(null, '<testcase classname="%s" name="%s" time="%s">',
      this.classname.replace(/"/g, '\''), this.name.replace(/"/g, '\''), this.time.toFixed(3));
    var cData = format.bind(null, '<![CDATA[%s]]>');
    var errorMessage = cData(this.result.failedExpectations.reduce(concatErrorMessages, ''));

    if (this.status === ERROR) {
      testCaseMessage = testCaseMessage
        .bind(null, format('<error message="test failure">%s</error>', errorMessage));
    } else if (this.status === FAILED) {
      testCaseMessage = testCaseMessage
        .bind(null, format('<failure message="test failure">%s</failure>', errorMessage));
    } else if (this.status === PENDING) {
      testCaseMessage = testCaseMessage.bind(null, '<skipped></skipped>');
    }

    testCaseMessage = testCaseMessage.bind(null, '</testcase>');

    return testCaseMessage();

    /**
     * Used by the reduce function, this will concatenate the previous value with the current stack trace.
     * @param {String} prev
     * @param {Object} current
     * @returns {String}
     */
    function concatErrorMessages(prev, current) {
      return prev + current.stack;
    }
  };

  return {
    TestSuite: TestSuite,
    TestCase: TestCase,
    ERROR: ERROR,
    FAILED: FAILED,
    PENDING: PENDING
  };
};
