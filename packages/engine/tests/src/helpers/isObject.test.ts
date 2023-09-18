import { isObject } from "../../../src/helpers/isObject";

describe('isObject', () => {
  it('should be true when the value is an object.', () => {
    expect(isObject({}));
    expect(isObject(Object.create({})));
    expect(isObject(Object.create(Object.prototype)));
    expect(isObject(Object.create(null)));
    expect(isObject(/foo/));

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    function Foo() {}
    expect(isObject(new Foo));
    expect(isObject(new Foo()));
  });

  it('should be false when the value is not an object.', function() {
    expect(!isObject('whatever'));
    expect(!isObject(1));
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(!isObject(function() {}));
    expect(!isObject([]));
    expect(!isObject(['foo', 'bar']));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(!isObject());
    expect(!isObject(undefined));
    expect(!isObject(null));
  });
});
