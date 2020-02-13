describe("matchersUtil", function() {
  it("exposes the injected pretty-printer as .pp", function() {
    var pp = function() {},
      matchersUtil = new jasmineUnderTest.MatchersUtil({pp: pp});

    expect(matchersUtil.pp).toBe(pp);
  });

  describe("equals", function() {
    describe('Properties', function() {
      var fc;

      beforeEach(function() {
        fc = jasmine.getEnv().requireFastCheck();
      });

      function basicAnythingSettings() {
        return {
          key: fc.oneof(fc.string(), fc.constantFrom('k1', 'k2', 'k3')),
          // Limiting depth & number of keys allows fast-check to try
          // a lot more scalar values.
          maxDepth: 2,
          maxKeys: 5,
          withBoxedValues: true,
          withMap: true,
          withSet: true
        };
      }

      function numRuns() {
        var many = 5000000;

        // Be thorough but very slow when specified (usually on CI).
        if (process.env.JASMINE_LONG_PROPERTY_TESTS) {
          console.log(
            'Using',
            many,
            'runs of fc.assert because JASMINE_LONG_PROPERTY_TESTS was set. This may take several minutes.'
          );
          return many;
        } else {
          return undefined;
        }
      }

      it('is symmetric', function() {
        var matchersUtil = new jasmineUnderTest.MatchersUtil();

        fc.assert(
          fc.property(
            fc.anything(basicAnythingSettings()),
            fc.anything(basicAnythingSettings()),
            function(a, b) {
              return (
                matchersUtil.equals(a, b) ===
                matchersUtil.equals(b, a)
              );
            }
          ),
          {
            numRuns: numRuns(),
            examples: [[0, 5e-324]]
          }
        );
      });

      it('is reflexive', function() {
        var matchersUtil = new jasmineUnderTest.MatchersUtil();
        var anythingSettings = basicAnythingSettings();
        anythingSettings.withMap = false;
        fc.assert(
          fc.property(fc.dedup(fc.anything(anythingSettings), 2), function(
            values
          ) {
            return matchersUtil.equals(values[0], values[1]);
          }),
          {
            numRuns: numRuns()
          }
        );
      });
    });

    it("passes for literals that are triple-equal", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals(null, null)).toBe(true);
      expect(matchersUtil.equals(void 0, void 0)).toBe(true);
    });

    it("fails for things that are not equivalent", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals({a: "foo"}, 1)).toBe(false);
    });

    it("passes for Strings that are equivalent", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals("foo", "foo")).toBe(true);
    });

    it("fails for Strings that are not equivalent", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals("foo", "bar")).toBe(false);
    });

    it("passes for Numbers that are equivalent", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals(123, 123)).toBe(true);
    });

    it("fails for Numbers that are not equivalent", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals(123, 456)).toBe(false);
    });

    it("passes for Dates that are equivalent", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals(new Date("Jan 1, 1970"), new Date("Jan 1, 1970"))).toBe(true);
    });

    it("fails for Dates that are not equivalent", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals(new Date("Jan 1, 1970"), new Date("Feb 3, 1991"))).toBe(false);
    });

    it("passes for Booleans that are equivalent", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals(true, true)).toBe(true);
    });

    it("fails for Booleans that are not equivalent", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals(true, false)).toBe(false);
    });

    it("passes for RegExps that are equivalent", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals(/foo/, /foo/)).toBe(true);
    });

    it("fails for RegExps that are not equivalent", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals(/foo/, /bar/)).toBe(false);
      expect(matchersUtil.equals(new RegExp("foo", "i"), new RegExp("foo"))).toBe(false);
    });

    it("passes for Arrays that are equivalent", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals([1, 2], [1, 2])).toBe(true);
    });

    it("passes for Arrays that are equivalent, with elements added by changing length", function() {
      var foo = [],
        matchersUtil = new jasmineUnderTest.MatchersUtil();
      foo.length = 1;

      expect(matchersUtil.equals(foo, [undefined])).toBe(true);
    });

    it("fails for Arrays that have different lengths", function() {
      matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals([1, 2], [1, 2, 3])).toBe(false);
    });

    it("fails for Arrays that have different elements", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals([1, 2, 3], [1, 5, 3])).toBe(false);
    });

    it("fails for Arrays whose contents are equivalent, but have differing properties", function() {
      var one = [1,2,3],
        two = [1,2,3],
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      one.foo = 'bar';
      two.foo = 'baz';

      expect(matchersUtil.equals(one, two)).toBe(false);
    });

    it("passes for Arrays with equivalent contents and properties", function() {
      var one = [1,2,3],
        two = [1,2,3],
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      one.foo = 'bar';
      two.foo = 'bar';

      expect(matchersUtil.equals(one, two)).toBe(true);
    });

    it("passes for Errors that are the same type and have the same message", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals(new Error("foo"), new Error("foo"))).toBe(true);
    });

    it("fails for Errors that are the same type and have different messages", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals(new Error("foo"), new Error("bar"))).toBe(false);
    });

    it("fails for objects with different constructors", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      function One() {}
      function Two() {}

      expect(matchersUtil.equals(new One(), new Two())).toBe(false);
    });

    it("passes for Objects that are equivalent (simple case)", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals({a: "foo"}, {a: "foo"})).toBe(true);
    });

    it("fails for Objects that are not equivalent (simple case)", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals({a: "foo"}, {a: "bar"})).toBe(false);
    });

    it("passes for Objects that are equivalent (deep case)", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals({a: "foo", b: { c: "bar"}}, {a: "foo", b: { c: "bar"}})).toBe(true);
    });

    it("fails for Objects that are not equivalent (deep case)", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals({a: "foo", b: { c: "baz"}}, {a: "foo", b: { c: "bar"}})).toBe(false);
    });

    it("passes for Objects that are equivalent (with cycles)", function() {
      var actual = { a: "foo" },
        expected = { a: "foo" },
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      actual.b = actual;
      expected.b = actual;

      expect(matchersUtil.equals(actual, expected)).toBe(true);
    });

    it("fails for Objects that are not equivalent (with cycles)", function() {
      var actual = { a: "foo" },
        expected = { a: "bar" },
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      actual.b = actual;
      expected.b = actual;

      expect(matchersUtil.equals(actual, expected)).toBe(false);
    });

    it("fails for Objects that have the same number of keys, but different keys/values", function () {
      var expected = { a: undefined },
        actual = { b: 1 },
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      expect(matchersUtil.equals(actual, expected)).toBe(false);
    });

    it("fails when comparing an empty object to an empty array (issue #114)", function() {
      var emptyObject = {},
        emptyArray = [],
        matchersUtil = new jasmineUnderTest.MatchersUtil();


      expect(matchersUtil.equals(emptyObject, emptyArray)).toBe(false);
      expect(matchersUtil.equals(emptyArray, emptyObject)).toBe(false);
    });

    it("passes for equivalent frozen objects (GitHub issue #266)", function() {
      var a = { foo: 1 },
        b = {foo: 1 },
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      Object.freeze(a);
      Object.freeze(b);

      expect(matchersUtil.equals(a,b)).toBe(true);
    });

    it("passes for equivalent Promises (GitHub issue #1314)", function() {
      if (typeof Promise === 'undefined') { return; }

      var p1 = new Promise(function () {}),
        p2 = new Promise(function () {}),
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      expect(matchersUtil.equals(p1, p1)).toBe(true);
      expect(matchersUtil.equals(p1, p2)).toBe(false);
    });

    describe("when running in a browser", function() {
      function isNotRunningInBrowser() {
        return typeof document === 'undefined'
      }

      it("passes for equivalent DOM nodes", function() {
        if (isNotRunningInBrowser()) {
          return;
        }
        var a = document.createElement("div");
        var matchersUtil = new jasmineUnderTest.MatchersUtil();

        a.setAttribute("test-attr", "attr-value");
        a.appendChild(document.createTextNode('test'));

        var b = document.createElement("div");
        b.setAttribute("test-attr", "attr-value");
        b.appendChild(document.createTextNode('test'));

        expect(matchersUtil.equals(a,b)).toBe(true);
      });

      it("passes for equivalent objects from different frames", function() {
        if (isNotRunningInBrowser()) {
          return;
        }
        var matchersUtil = new jasmineUnderTest.MatchersUtil();
        var iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        iframe.contentWindow.eval('window.testObject = {}');
        expect(matchersUtil.equals({}, iframe.contentWindow.testObject)).toBe(true);
        document.body.removeChild(iframe);
      });

      it("fails for DOM nodes with different attributes or child nodes", function() {
        if (isNotRunningInBrowser()) {
          return;
        }
        var matchersUtil = new jasmineUnderTest.MatchersUtil();
        var a = document.createElement("div");
        a.setAttribute("test-attr", "attr-value");
        a.appendChild(document.createTextNode('test'));

        var b = document.createElement("div");
        b.setAttribute("test-attr", "attr-value2");
        b.appendChild(document.createTextNode('test'));

        expect(matchersUtil.equals(a,b)).toBe(false);

        b.setAttribute("test-attr", "attr-value");
        expect(matchersUtil.equals(a,b)).toBe(true);

        b.appendChild(document.createTextNode('2'));
        expect(matchersUtil.equals(a,b)).toBe(false);

        a.appendChild(document.createTextNode('2'));
        expect(matchersUtil.equals(a,b)).toBe(true);
      });
    });

    describe("when running in Node", function() {
      function isNotRunningInNode() {
        return typeof require !== 'function'
      }

      it("passes for equivalent objects from different vm contexts", function() {
        if (isNotRunningInNode()) {
          return;
        }
        var matchersUtil = new jasmineUnderTest.MatchersUtil();
        var vm = require('vm');
        var sandbox = {
          obj: null
        };
        vm.runInNewContext('obj = {a: 1, b: 2}', sandbox);

        expect(matchersUtil.equals(sandbox.obj, {a: 1, b: 2})).toBe(true);
      });

      it("passes for equivalent arrays from different vm contexts", function() {
        if (isNotRunningInNode()) {
          return;
        }
        var matchersUtil = new jasmineUnderTest.MatchersUtil();
        var vm = require('vm');
        var sandbox = {
          arr: null
        };
        vm.runInNewContext('arr = [1, 2]', sandbox);

        expect(matchersUtil.equals(sandbox.arr, [1, 2])).toBe(true);
      });
    });

    it("passes when Any is used", function() {
      var number = 3,
        anyNumber = new jasmineUnderTest.Any(Number),
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      expect(matchersUtil.equals(number, anyNumber)).toBe(true);
      expect(matchersUtil.equals(anyNumber, number)).toBe(true);
    });

    it("fails when Any is compared to something unexpected", function() {
      var number = 3,
        anyString = new jasmineUnderTest.Any(String),
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      expect(matchersUtil.equals(number, anyString)).toBe(false);
      expect(matchersUtil.equals(anyString, number)).toBe(false);
    });

    it("passes when ObjectContaining is used", function() {
      var obj = {
        foo: 3,
        bar: 7
      },
        containing = new jasmineUnderTest.ObjectContaining({foo: 3}),
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      expect(matchersUtil.equals(obj, containing)).toBe(true);
      expect(matchersUtil.equals(containing, obj)).toBe(true);
    });

    it("passes when MapContaining is used", function() {
      jasmine.getEnv().requireFunctioningMaps();

      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      var obj = new Map();
      obj.set(1, 2);
      obj.set('foo', 'bar');
      var containing = new jasmineUnderTest.MapContaining(new Map());
      containing.sample.set('foo', 'bar');

      expect(matchersUtil.equals(obj, containing)).toBe(true);
      expect(matchersUtil.equals(containing, obj)).toBe(true);
    });

    it("passes when SetContaining is used", function() {
      jasmine.getEnv().requireFunctioningSets();

      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      var obj = new Set();
      obj.add(1);
      obj.add('foo');
      var containing = new jasmineUnderTest.SetContaining(new Set());
      containing.sample.add(1);

      expect(matchersUtil.equals(obj, containing)).toBe(true);
      expect(matchersUtil.equals(containing, obj)).toBe(true);
    });

    it("passes when an asymmetric equality tester returns true", function() {
      var tester = { asymmetricMatch: function(other) { return true; } },
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      expect(matchersUtil.equals(false, tester)).toBe(true);
      expect(matchersUtil.equals(tester, false)).toBe(true);
    });

    it("fails when an asymmetric equality tester returns false", function() {
      var tester = { asymmetricMatch: function(other) { return false; } },
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      expect(matchersUtil.equals(true, tester)).toBe(false);
      expect(matchersUtil.equals(tester, true)).toBe(false);
    });

    it("passes when ArrayContaining is used", function() {
      var arr = ["foo", "bar"],
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      expect(matchersUtil.equals(arr, new jasmineUnderTest.ArrayContaining(["bar"]))).toBe(true);
    });

    it("passes when a custom equality matcher returns true", function() {
      var tester = function(a, b) { return true; },
        matchersUtil = new jasmineUnderTest.MatchersUtil({customTesters: [tester], pp: function() {}});

      expect(matchersUtil.equals(1, 2)).toBe(true);
    });

    it("passes for two empty Objects", function () {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals({}, {})).toBe(true);
    });

    describe("when a custom equality matcher returns 'undefined'", function () {
      var tester = function(a, b) { return jasmine.undefined; };

      it("passes for two empty Objects", function () {
        var matchersUtil = new jasmineUnderTest.MatchersUtil({customTesters: [tester], pp: function() {}});
        expect(matchersUtil.equals({}, {})).toBe(true);
      });
    });

    it("fails for equivalents when a custom equality matcher returns false", function() {
      var tester = function(a, b) { return false; },
        matchersUtil = new jasmineUnderTest.MatchersUtil({customTesters: [tester], pp: function() {}});

      expect(matchersUtil.equals(1, 1)).toBe(false);
    });


    it("passes for an asymmetric equality tester that returns true when a custom equality tester return false", function() {
      var asymmetricTester = { asymmetricMatch: function(other) { return true; } },
        symmetricTester = function(a, b) { return false; },
        matchersUtil = new jasmineUnderTest.MatchersUtil({customTesters: [symmetricTester()], pp: function() {}});

      expect(matchersUtil.equals(asymmetricTester, true)).toBe(true);
      expect(matchersUtil.equals(true, asymmetricTester)).toBe(true);
    });

    it("passes when an Any is compared to an Any that checks for the same type", function() {
      var any1 = new jasmineUnderTest.Any(Function),
        any2 = new jasmineUnderTest.Any(Function),
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      expect(matchersUtil.equals(any1, any2)).toBe(true);
    });

    it("passes for null prototype objects with same properties", function () {
      var objA = Object.create(null),
        objB = Object.create(null),
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      objA.name = 'test';
      objB.name = 'test';

      expect(matchersUtil.equals(objA, objB)).toBe(true);
    });

    it("fails for null prototype objects with different properties", function () {
      var objA = Object.create(null),
        objB = Object.create(null),
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      objA.name = 'test';
      objB.test = 'name';

      expect(matchersUtil.equals(objA, objB)).toBe(false);
    });

    it("passes when comparing two empty sets", function() {
      jasmine.getEnv().requireFunctioningSets();
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals(new Set(), new Set())).toBe(true);
    });

    it("passes when comparing identical sets", function() {
      jasmine.getEnv().requireFunctioningSets();

      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      var setA = new Set();
      setA.add(6);
      setA.add(5);
      var setB = new Set();
      setB.add(6);
      setB.add(5);

      expect(matchersUtil.equals(setA, setB)).toBe(true);
    });

    it("passes when comparing identical sets with different insertion order and simple elements", function() {
      jasmine.getEnv().requireFunctioningSets();

      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      var setA = new Set();
      setA.add(3);
      setA.add(6);
      var setB = new Set();
      setB.add(6);
      setB.add(3);

      expect(matchersUtil.equals(setA, setB)).toBe(true);
    });

    it("passes when comparing identical sets with different insertion order and complex elements 1", function() {
      jasmine.getEnv().requireFunctioningSets();

      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      var setA1 = new Set();
      setA1.add(['a',3]);
      setA1.add([6,1]);
      var setA2 = new Set();
      setA1.add(['y',3]);
      setA1.add([6,1]);
      var setA = new Set();
      setA.add(setA1);
      setA.add(setA2);


      var setB1 = new Set();
      setB1.add([6,1]);
      setB1.add(['a',3]);
      var setB2 = new Set();
      setB1.add([6,1]);
      setB1.add(['y',3]);
      var setB = new Set();
      setB.add(setB1);
      setB.add(setB2);

      expect(matchersUtil.equals(setA, setB)).toBe(true);
    });

    it("passes when comparing identical sets with different insertion order and complex elements 2", function() {
      jasmine.getEnv().requireFunctioningSets();

      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      var setA = new Set();
      setA.add([[1,2], [3,4]]);
      setA.add([[5,6], [7,8]]);
      var setB = new Set();
      setB.add([[5,6], [7,8]]);
      setB.add([[1,2], [3,4]]);

      expect(matchersUtil.equals(setA, setB)).toBe(true);
    });

    it("fails for sets with different elements", function() {
      jasmine.getEnv().requireFunctioningSets();
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      var setA = new Set();
      setA.add(6);
      setA.add(3);
      setA.add(5);
      var setB = new Set();
      setB.add(6);
      setB.add(4);
      setB.add(5);

      expect(matchersUtil.equals(setA, setB)).toBe(false);
    });

    it("fails for sets of different size", function() {
      jasmine.getEnv().requireFunctioningSets();
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      var setA = new Set();
      setA.add(6);
      setA.add(3);
      var setB = new Set();
      setB.add(6);
      setB.add(4);
      setB.add(5);

      expect(matchersUtil.equals(setA, setB)).toBe(false);
    });

    it("passes when comparing two empty maps", function() {
      jasmine.getEnv().requireFunctioningMaps();
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.equals(new Map(), new Map())).toBe(true);
    });

    it("passes when comparing identical maps", function() {
      jasmine.getEnv().requireFunctioningMaps();
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      var mapA = new Map();
      mapA.set(6, 5);
      var mapB = new Map();
      mapB.set(6, 5);
      expect(matchersUtil.equals(mapA, mapB)).toBe(true);
    });

    it("passes when comparing identical maps with different insertion order", function() {
      jasmine.getEnv().requireFunctioningMaps();
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      var mapA = new Map();
      mapA.set("a", 3);
      mapA.set(6, 1);
      var mapB = new Map();
      mapB.set(6, 1);
      mapB.set("a", 3);
      expect(matchersUtil.equals(mapA, mapB)).toBe(true);
    });

    it("fails for maps with different elements", function() {
      jasmine.getEnv().requireFunctioningMaps();
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      var mapA = new Map();
      mapA.set(6, 3);
      mapA.set(5, 1);
      var mapB = new Map();
      mapB.set(6, 4);
      mapB.set(5, 1);

      expect(matchersUtil.equals(mapA, mapB)).toBe(false);
    });

    it("fails for maps of different size", function() {
      jasmine.getEnv().requireFunctioningMaps();
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      var mapA = new Map();
      mapA.set(6, 3);
      var mapB = new Map();
      mapB.set(6, 4);
      mapB.set(5, 1);
      expect(matchersUtil.equals(mapA, mapB)).toBe(false);
    });

    describe("when running in an environment with array polyfills", function() {
      var findIndexDescriptor = Object.getOwnPropertyDescriptor(Array.prototype, 'findIndex');

      beforeEach(function() {
        if (!findIndexDescriptor) {
          jasmine.getEnv().pending('Environment does not have a property descriptor for Array.prototype.findIndex');
        }

        Object.defineProperty(Array.prototype, 'findIndex', {
          enumerable: true,
          value: function (predicate) {
            if (this === null) {
              throw new TypeError('Array.prototype.findIndex called on null or undefined');
            }

            if (typeof predicate !== 'function') {
              throw new TypeError('predicate must be a function');
            }

            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
              value = list[i];
              if (predicate.call(thisArg, value, i, list)) {
                return i;
              }
            }

            return -1;
          }
        });
      });

      afterEach(function() {
        Object.defineProperty(Array.prototype, 'findIndex', findIndexDescriptor);
      });

      it("passes when there's an array polyfill", function() {
        expect(['foo']).toEqual(['foo']);
      });
    });

    describe("Building diffs for asymmetric equality testers", function() {
      it("diffs the values returned by valuesForDiff_", function() {
        var tester = {
            asymmetricMatch: function() { return false; },
            valuesForDiff_: function() {
              return {
                self: 'asymmetric tester value',
                other: 'other value'
              };
            }
          },
          actual = {x: 42},
          expected = {x: tester},
          diffBuilder = jasmine.createSpyObj('diffBuilder', ['recordMismatch', 'withPath', 'setRoots']),
          matchersUtil = new jasmineUnderTest.MatchersUtil();

        diffBuilder.withPath.and.callFake(function(p, block) { block(); });
        matchersUtil.equals(actual, expected, diffBuilder);

        expect(diffBuilder.setRoots).toHaveBeenCalledWith(actual, expected);
        expect(diffBuilder.withPath).toHaveBeenCalledWith('x', jasmine.any(Function));
        expect(diffBuilder.recordMismatch). toHaveBeenCalledWith();
      });

      it("records both objects when the tester does not implement valuesForDiff", function() {
        var tester = {
            asymmetricMatch: function() { return false; },
          },
          actual = {x: 42},
          expected = {x: tester},
          diffBuilder = jasmine.createSpyObj('diffBuilder', ['recordMismatch', 'withPath', 'setRoots']),
          matchersUtil = new jasmineUnderTest.MatchersUtil();

        diffBuilder.withPath.and.callFake(function(p, block) { block(); });
        matchersUtil.equals(actual, expected, diffBuilder);

        expect(diffBuilder.setRoots).toHaveBeenCalledWith(actual, expected);
        expect(diffBuilder.withPath).toHaveBeenCalledWith('x', jasmine.any(Function));
        expect(diffBuilder.recordMismatch). toHaveBeenCalledWith();
      });
    });

    it('uses a diffBuilder if one is provided as the third argument', function() {
      var diffBuilder = new jasmineUnderTest.DiffBuilder(),
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      spyOn(diffBuilder, 'recordMismatch');
      spyOn(diffBuilder, 'withPath').and.callThrough();

      matchersUtil.equals([1], [2], diffBuilder);
      expect(diffBuilder.withPath).toHaveBeenCalledWith('length', jasmine.any(Function));
      expect(diffBuilder.withPath).toHaveBeenCalledWith(0, jasmine.any(Function));
      expect(diffBuilder.recordMismatch).toHaveBeenCalled();
    });
  });

  describe("contains", function() {
    it("passes when expected is a substring of actual", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.contains("ABC", "BC")).toBe(true);
    });

    it("fails when expected is a not substring of actual", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.contains("ABC", "X")).toBe(false);
    });

    it("passes when expected is an element in an actual array", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.contains(['foo', 'bar'], 'foo')).toBe(true);
    });

    it("fails when expected is not an element in an actual array", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.contains(['foo', 'bar'], 'baz')).toBe(false);
    });

    it("passes with mixed-element arrays", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.contains(["foo", {some: "bar"}], "foo")).toBe(true);
      expect(matchersUtil.contains(["foo", {some: "bar"}], {some: "bar"})).toBe(true);
    });

    it("uses custom equality testers if actual is an Array", function() {
      var customTester = function(a, b) {return true;},
        matchersUtil = new jasmineUnderTest.MatchersUtil({customTesters: [customTester], pp: function() {}});

      expect(matchersUtil.contains([1, 2], 3)).toBe(true);
    });

    it("fails when actual is undefined", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.contains(undefined, 'A')).toBe(false);
    });

    it("fails when actual is null", function() {
      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      expect(matchersUtil.contains(null, 'A')).toBe(false);
    });

    it("passes with array-like objects", function() {
      var capturedArgs = null,
        matchersUtil = new jasmineUnderTest.MatchersUtil();

      function testFunction(){
        capturedArgs = arguments;
      }

      testFunction('foo', 'bar');
      expect(matchersUtil.contains(capturedArgs, 'bar')).toBe(true);
    });

    it("passes for set members", function() {
      jasmine.getEnv().requireFunctioningSets();

      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      var setItem = {'foo': 'bar'};
      var set = new Set();
      set.add(setItem);

      expect(matchersUtil.contains(set, setItem)).toBe(true);
    });

    // documenting current behavior
    it("fails (!) for objects that equal to a set member", function() {
      jasmine.getEnv().requireFunctioningSets();

      var matchersUtil = new jasmineUnderTest.MatchersUtil();
      var set = new Set();
      set.add({'foo': 'bar'});

      expect(matchersUtil.contains(set, {'foo': 'bar'})).toBe(false);
    });
  });

  describe("buildFailureMessage", function() {

    it("builds an English sentence for a failure case", function() {
      var actual = "foo",
        name = "toBar",
        pp = jasmineUnderTest.makePrettyPrinter(),
        matchersUtil = new jasmineUnderTest.MatchersUtil({pp: pp}),
        message = matchersUtil.buildFailureMessage(name, false, actual);

      expect(message).toEqual("Expected 'foo' to bar.");
    });

    it("builds an English sentence for a 'not' failure case", function() {
      var actual = "foo",
        name = "toBar",
        isNot = true,
        pp = jasmineUnderTest.makePrettyPrinter(),
        matchersUtil = new jasmineUnderTest.MatchersUtil({pp: pp}),
        message = message = matchersUtil.buildFailureMessage(name, isNot, actual);

      expect(message).toEqual("Expected 'foo' not to bar.");
    });

    it("builds an English sentence for an arbitrary array of expected arguments", function() {
      var actual = "foo",
        name = "toBar",
        pp = jasmineUnderTest.makePrettyPrinter(),
        matchersUtil = new jasmineUnderTest.MatchersUtil({pp: pp}),
        message = matchersUtil.buildFailureMessage(name, false, actual, "quux", "corge");

      expect(message).toEqual("Expected 'foo' to bar 'quux', 'corge'.");
    });

    it("uses the injected pretty-printer to format the expecteds and actual", function() {
      var actual = "foo",
        expected1 = "qux",
        expected2 = "grault",
        name = "toBar",
        isNot = false,
        pp = function(value) { return '<' + value + '>'; },
        matchersUtil = new jasmineUnderTest.MatchersUtil({pp: pp}),
        message = message = matchersUtil.buildFailureMessage(name, isNot, actual, expected1, expected2);

      expect(message).toEqual("Expected <foo> to bar <qux>, <grault>.");
    });
  });
});
