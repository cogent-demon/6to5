exports.default = 42;
exports.default = {};

exports.default = [];

exports.default = foo;

exports.default = function () {}

exports.default = function () {
  function Anonymous() {
  }
  return Anonymous;
}();

exports.default = function foo () {}

exports.default = function () {
  function foo() {
  }
  return foo;
}();
