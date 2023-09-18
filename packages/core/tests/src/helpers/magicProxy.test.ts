import { isProxy } from "util/types";
import { createMagicProxy } from "../../../src/helpers/magicProxy";

describe('magicProxy', () => {
  it('should create a recursive proxy', () => {
    const magic = createMagicProxy();
    expect(magic.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z).toBeInstanceOf(Object);
    expect(magic).toBeInstanceOf(Object);
    expect(isProxy(magic)).toBe(true);
  });
});
