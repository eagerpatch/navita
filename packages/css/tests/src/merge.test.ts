import { merge } from "../../src";

describe('merge', () => {
  it('should merge atomic classes', () => {
    expect(merge('a1', 'b2', 'b3', 'c3')).toEqual('a1 b3 c3');
  });

  it('should still somewhat work with classNames that are not atomic', () => {
    expect(merge('alexander', 'tobias')).toEqual('alexander tobias');
  });

  it('will always take the latest if the classNames are not atomic', () => {
    expect(merge('alexander', 'alexander')).toEqual('alexander');
    expect(merge('alexander1', 'alexander2', 'alexander3')).toEqual('alexander3');
  });
});
