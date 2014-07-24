krusty-jasmine-reporter
=======================

A reporter used to generate jasmine to JUnit results that can be interpreted by Jenkins

Important Notes
===============
This reporter was created to be used in [minijasminenodewrap](https://github.com/krusty-krab/minijasminenodewrap). That being said, the reporter is modular and can easily fit into any other project that needs to export jasmine data to a JUnit format that Jenkins can interpret. Please refer to minijasminenodewrap for an example of how this reporter is used. 

Usage
=====
To use this reporter, simply add it as a reporter to jasmine like so:

```javascript
var miniJasmineLib = require('minijasminenode2');
// define any options here
var options = {};

if (argv.reportType === 'junit') {
    options.JUnitReportSavePath = options.JUnitReportSavePath || './';
    options.JUnitReportFilePrefix = options.JUnitReportFilePrefix || 'results';
    options.JUnitReportSuiteName = options.JUnitReportSuiteName || 'Tests';
    options.JUnitReportPackageName = options.JUnitReportPackageName || 'Tests';
    miniJasmineLib.addReporter(new krustyJasmineReporter.KrustyJasmineJUnitReporter(options));
  }
```

The reporter is designed to output to the save path and file prefix that you specify. After running the unit tests, you should see the <options.JUnitReportFilePrefix>.xml containing your test results in a format that Jenkins can interpret.

