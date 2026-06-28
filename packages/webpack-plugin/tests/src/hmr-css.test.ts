import { vi } from "vitest";

// Minimal DOM doubles implementing only the surface that `hmr/css.ts` touches.
class FakeLink {
  attrs: Record<string, string> = {};
  loaded?: boolean;
  parentNode: FakeParent | null = null;
  listeners: Record<string, () => void> = {};

  get nextSibling(): FakeLink | null {
    if (!this.parentNode) {
      return null;
    }
    const index = this.parentNode.children.indexOf(this);
    return this.parentNode.children[index + 1] ?? null;
  }

  getAttribute(name: string): string | null {
    return this.attrs[name] ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.attrs[name] = value;
  }

  addEventListener(type: string, callback: () => void): void {
    this.listeners[type] = callback;
  }

  dispatch(type: string): void {
    this.listeners[type]?.();
  }

  cloneNode(): FakeLink {
    const clone = new FakeLink();
    clone.attrs = { ...this.attrs };
    return clone;
  }

  remove(): void {
    if (this.parentNode) {
      this.parentNode.children = this.parentNode.children.filter(
        (child) => child !== this,
      );
      this.parentNode = null;
    }
  }
}

class FakeParent {
  children: FakeLink[] = [];

  // Mirrors DOM semantics: appending an existing child moves it to the end.
  appendChild(element: FakeLink): FakeLink {
    const existing = this.children.indexOf(element);
    if (existing !== -1) {
      this.children.splice(existing, 1);
    }
    element.parentNode = this;
    this.children.push(element);
    return element;
  }

  insertBefore(element: FakeLink, reference: FakeLink): FakeLink {
    const existing = this.children.indexOf(element);
    if (existing !== -1) {
      this.children.splice(existing, 1);
    }
    const referenceIndex = this.children.indexOf(reference);
    this.children.splice(
      referenceIndex === -1 ? this.children.length : referenceIndex,
      0,
      element,
    );
    element.parentNode = this;
    return element;
  }
}

const link = (href: string): FakeLink => {
  const element = new FakeLink();
  element.attrs.href = href;
  element.attrs.rel = "stylesheet";
  return element;
};

let hashValue: string;

// Reload the module fresh per test so its captured `previousHash` is reset.
async function loadCss(initialHash: string) {
  hashValue = initialHash;
  (
    globalThis as unknown as { __webpack_require__: unknown }
  ).__webpack_require__ = { navitaDevHash: () => hashValue };
  vi.resetModules();
  const mod = await import("../../src/hmr/css");
  return mod.css;
}

describe("hmr/css", () => {
  afterEach(() => {
    delete (globalThis as unknown as { document?: unknown }).document;
    delete (globalThis as unknown as { __webpack_require__?: unknown })
      .__webpack_require__;
  });

  it("does nothing when the dev hash is unchanged", async () => {
    const parent = new FakeParent();
    const navita = link("https://cdn/static/css/navita.css");
    parent.appendChild(navita);
    (globalThis as unknown as { document: unknown }).document = {
      querySelectorAll: () => [navita],
    };

    const css = await loadCss("same");
    css(); // hashValue unchanged

    expect(parent.children).toEqual([navita]);
  });

  // Locks C2: when the navita link is the last child (no nextSibling) the
  // *new* element must be appended. The old bug re-appended the old element,
  // so the reloaded stylesheet never entered the DOM.
  it("appends the NEW element when the link has no nextSibling", async () => {
    const parent = new FakeParent();
    const navita = link("https://cdn/static/css/navita.css");
    parent.appendChild(navita);
    (globalThis as unknown as { document: unknown }).document = {
      querySelectorAll: () => [navita],
    };

    const css = await loadCss("hash-1");
    hashValue = "hash-2";
    css();

    // The clone is in the DOM alongside the original (which is removed on load).
    expect(parent.children).toHaveLength(2);
    const newElement = parent.children.find((child) => child !== navita)!;
    expect(newElement).toBeDefined();
    expect(newElement.getAttribute("href")).toMatch(/navita\.css\?\d+$/);
    expect(newElement.loaded).toBe(false);

    // Once the clone loads, the old element is removed.
    newElement.dispatch("load");
    expect(parent.children).toEqual([newElement]);
  });

  it("inserts before the nextSibling when one exists", async () => {
    const parent = new FakeParent();
    const navita = link("https://cdn/static/css/navita.css");
    const other = link("https://cdn/static/css/other.css");
    parent.appendChild(navita);
    parent.appendChild(other);
    (globalThis as unknown as { document: unknown }).document = {
      querySelectorAll: () => [navita, other],
    };

    const css = await loadCss("hash-1");
    hashValue = "hash-2";
    css();

    // [navita, newElement, other]
    expect(parent.children).toHaveLength(3);
    const newElement = parent.children[1];
    expect(newElement).not.toBe(navita);
    expect(newElement).not.toBe(other);
    expect(newElement.getAttribute("href")).toMatch(/navita\.css\?\d+$/);
  });

  it("falls back to reloading all stylesheets when none match navita.css", async () => {
    const parent = new FakeParent();
    const app = link("https://cdn/static/css/app.css");
    parent.appendChild(app);
    (globalThis as unknown as { document: unknown }).document = {
      querySelectorAll: () => [app],
    };

    const css = await loadCss("hash-1");
    hashValue = "hash-2";
    css();

    expect(parent.children).toHaveLength(2);
    const newElement = parent.children.find((child) => child !== app)!;
    expect(newElement.getAttribute("href")).toMatch(/app\.css\?\d+$/);
  });
});
