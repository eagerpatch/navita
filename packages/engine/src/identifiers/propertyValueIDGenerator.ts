import type { IdentifierGenerator, StyleBlock } from "../types";
import { AlphaIDGenerator } from "./alphaIDGenerator";

export class PropertyValueIDGenerator implements IdentifierGenerator<StyleBlock> {
  private property = new AlphaIDGenerator();

  private cache: Record<string, {
    key: string;
    cache: Record<string, number>;
  }> = {};

  next({ property, media = '', support = '', container = '', pseudo = '', value }: StyleBlock) {
    const propertyKey = `${media}${support}${container}${pseudo}${property}`;

    if (this.cache[propertyKey] === undefined) {
      this.cache[propertyKey] = {
        key: this.property.next(),
        cache: {},
      };
    }

    const entry = this.cache[propertyKey];

    if (entry.cache[value] === undefined) {
      entry.cache[value] = Object.keys(entry.cache).length + 1;
    }

    return `${entry.key}${entry.cache[value]}`;
  }
}
