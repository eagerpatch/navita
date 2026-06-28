import type { IdentifierGenerator } from "../types";

export class IDGenerator implements IdentifierGenerator<undefined> {
  private counter = 1;

  next() {
    return this.counter++;
  }
}
