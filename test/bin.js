var readdir = require("fs-readdir-recursive");
var assert  = require("assert");
var rimraf  = require("rimraf");
var mkdirp  = require("mkdirp");
var child   = require("child_process");
var path    = require("path");
var fs      = require("fs");
var _       = require("lodash");

var fixtureLoc = __dirname + "/fixtures/bin";
var tmpLoc = __dirname + "/tmp";

var readFile = function (filename) {
  return fs.readFileSync(filename, "utf8").trim();
};

var readDir = function (loc) {
  var files = {};
  if (fs.existsSync(loc)) {
    _.each(readdir(loc), function (filename) {
      var contents = readFile(loc + "/" + filename);
      files[filename] = contents;
    });
  }
  return files;
};

var saveInFiles = function (files) {
  _.each(files, function (content, filename) {
    var up = path.normalize(filename + "/..");
    mkdirp.sync(up);

    fs.writeFileSync(filename, content);
  });
};

var assertTest = function (stdout, stderr, opts) {
  var expectStderr = opts.stderr.trim();
  stderr = stderr.trim();

  if (opts.stderr) {
    if (opts.stderrContains) {
      assert.ok(_.contains(stderr, expectStderr), "stderr " + JSON.stringify(stderr) + " didn't contain " + JSON.stringify(expectStderr));
    } else {
      assert.equal(stderr, expectStderr, "stderr didn't match");
    }
  } else if (stderr) {
    throw new Error("stderr: " + JSON.stringify(stderr));
  }

  var expectStdout = opts.stdout.trim();
  stdout = stdout.trim();

  if (opts.stdout) {
    if (opts.stdoutContains) {
      assert.ok(_.contains(stdout, expectStdout), "stdout " + JSON.stringify(stdout) + " didn't contain " + JSON.stringify(expectStdout));
    } else {
      assert.equal(stdout, expectStdout, "stdout didn't match");
    }
  } else if (stdout) {
    throw new Error("stdout: " + JSON.stringify(stdout));
  }

  _.each(opts.outFiles, function (expect, filename) {
    var actual = readFile(filename);
    assert.equal(actual, expect, "out-file " + filename);
  });
};

var build = function (binName, testName, opts) {
  var binLoc = path.normalize(__dirname + "/../bin/" + binName);

  return function (callback) {
    this.timeout(5000);
    saveInFiles(opts.inFiles);

    var args  = [binLoc].concat(opts.args);
    var spawn = child.spawn(process.execPath, args);

    var stderr = "";
    var stdout = "";

    spawn.stderr.on("data", function (chunk) {
      stderr += chunk;
    });

    spawn.stdout.on("data", function (chunk) {
      stdout += chunk;
    });

    spawn.on("close", function () {
      var err;

      try {
        assertTest(stdout, stderr, opts);
      } catch (e) {
        err = e;
      }

      if (err) {
        err.message = args.join(" ") + ": " + err.message;
      }

      callback(err);
    });

    if (opts.stdin) {
      spawn.stdin.write(opts.stdin);
      spawn.stdin.end();
    }
  };
};

before(function () {
  if (fs.existsSync(tmpLoc)) rimraf.sync(tmpLoc);
  fs.mkdirSync(tmpLoc);
  process.chdir(tmpLoc);
});

_.each(fs.readdirSync(fixtureLoc), function (binName) {
  if (binName[0] === ".") return;

  var suiteLoc = fixtureLoc + "/" + binName;
  suite("bin/" + binName, function () {
    _.each(fs.readdirSync(fixtureLoc + "/" + binName), function (testName) {
      if (testName[0] === ".") return;

      var testLoc = suiteLoc + "/" + testName;

      var opts = {
        args: []
      };

      var optionsLoc = testLoc + "/options.json"
      if (fs.existsSync(optionsLoc)) _.merge(opts, require(optionsLoc));

      _.each(["stdout", "stdin", "stderr"], function (key) {
        var loc = testLoc + "/" + key + ".txt";
        if (fs.existsSync(loc)) {
          opts[key] = readFile(loc);
        } else {
          opts[key] = opts[key] || "";
        }
      });

      opts.outFiles = readDir(testLoc + "/out-files");
      opts.inFiles  = readDir(testLoc + "/in-files");

      test(testName, build(binName, testName, opts));
    });
  });
});

after(function () {
  rimraf.sync(tmpLoc);
});
