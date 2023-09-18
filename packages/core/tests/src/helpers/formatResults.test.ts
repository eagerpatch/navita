import { ClassList, Static } from '@navita/engine';
import { formatResults } from '../../../src/helpers/formatResults';

describe('formatResults', () => {
  it('should handle classList in client mode', () => {
    expect(
      formatResults([
        new ClassList('a b'),
        new ClassList('c'),
      ]),
    ).toEqual('const $$evaluatedValues = ["a b","c"];');
  });

  it('handles static values', () => {
    expect(
      formatResults([new Static(), new Static()])
    ).toEqual('const $$evaluatedValues = [,];');
  });

  it('handles other values', () => {
    expect(
      formatResults([1, 'string', { wow: 'cool' }]),
    ).toEqual('const $$evaluatedValues = [1,"string",{"wow":"cool"}];');
  });
});
