import { transformContentProperty } from "../../../src/helpers/transformContentProperty";

describe('transformContentProperty', () => {
  it('should add quotes if not exist', () => {
    expect(transformContentProperty('')).toEqual('""');
    expect(transformContentProperty('foo')).toEqual('"foo"');
  });

  it('should not add quotes if already exist', () => {
    expect(transformContentProperty('"foo"')).toEqual('"foo"');
    expect(transformContentProperty("'foo'")).toEqual("'foo'");
  });

  it('should not add quotes to meaningful content values (examples from mdn: https://developer.mozilla.org/en-US/docs/Web/CSS/content)', () => {
    expect(transformContentProperty('none')).toEqual('none');
    expect(transformContentProperty('url("http://www.example.com/test.png")')).toEqual('url("http://www.example.com/test.png")');
    expect(transformContentProperty('linear-gradient(#e66465, #9198e5)')).toEqual('linear-gradient(#e66465, #9198e5)');
    expect(transformContentProperty('image-set("image1x.png" 1x, "image2x.png" 2x)')).toEqual('image-set("image1x.png" 1x, "image2x.png" 2x)');
    expect(transformContentProperty('url("http://www.example.com/test.png") / "This is the alt text"')).toEqual('url("http://www.example.com/test.png") / "This is the alt text"');
    expect(transformContentProperty('"prefix"')).toEqual('"prefix"');
    expect(transformContentProperty('counter(chapter_counter)')).toEqual('counter(chapter_counter)');
    expect(transformContentProperty('counter(chapter_counter, upper-roman)')).toEqual('counter(chapter_counter, upper-roman)');
    expect(transformContentProperty('counters(section_counter, ".")')).toEqual('counters(section_counter, ".")');
    expect(transformContentProperty('counters(section_counter, ".", decimal-leading-zero)')).toEqual('counters(section_counter, ".", decimal-leading-zero)');
    expect(transformContentProperty('attr(value string)')).toEqual('attr(value string)');
    expect(transformContentProperty('open-quote')).toEqual('open-quote');
    expect(transformContentProperty('close-quote')).toEqual('close-quote');
    expect(transformContentProperty('no-open-quote')).toEqual('no-open-quote');
    expect(transformContentProperty('no-close-quote')).toEqual('no-close-quote');
    expect(transformContentProperty('open-quote counter(chapter_counter)')).toEqual('open-quote counter(chapter_counter)');
    expect(transformContentProperty('inherit')).toEqual('inherit');
    expect(transformContentProperty('initial')).toEqual('initial');
    expect(transformContentProperty('revert')).toEqual('revert');
    expect(transformContentProperty('unset')).toEqual('unset');
  });
});
