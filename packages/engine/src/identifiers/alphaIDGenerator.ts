import type { IdentifierGenerator } from "../types";

const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const charLength = chars.length;

export class AlphaIDGenerator implements IdentifierGenerator<undefined> {
  private counter = 1;

  constructor(private blacklist = ['ad']) {}

  next() {
    const nextString = (id, className = '') => {
      if (id <= charLength) {
        return chars[id - 1] + className;
      }

      return nextString(
        (id / charLength) | 0,
        chars[(id - 1) % charLength] + className
      );
    };

    let className: string;
    do {
      className = nextString(this.counter++);
    } while (this.blacklist.includes(className.toLowerCase()));

    return className;
  }
}
