var assert = require("assert");
var util   = require("../lib/6to5/util");

suite("util", function () {
  test("duplicate mutator map", function () {
    var map = {
      test: {
        get: {}
      }
    };

    assert.throws(function () {
      util.pushMutatorMap(map, "test", "get", {});
    }, /a get already exists for this property/);
  });

  test("canCompile", function () {
    assert.ok(util.canCompile("test.js"));
    assert.ok(util.canCompile("/test.js"));
    assert.ok(util.canCompile("/scripts/test.js"));

    assert.ok(util.canCompile("test.es6"));
    assert.ok(util.canCompile("/test.es6"));
    assert.ok(util.canCompile("/scripts/test.es6"));

    assert.ok(!util.canCompile("test"));
    assert.ok(!util.canCompile("test.css"));
    assert.ok(!util.canCompile("/test.css"));
    assert.ok(!util.canCompile("/scripts/test.css"));
  });

  test("isAbsolute", function () {
    assert.ok(util.isAbsolute("/test.js"));
    assert.ok(util.isAbsolute("C:\\test.js"));

    assert.ok(!util.isAbsolute("test.js"));
    assert.ok(!util.isAbsolute("test/test.js"));
  });

  test("invalid template", function () {
    assert.throws(function () {
      util.template("invalid template");
    }, /unknown template/);
  });
});
