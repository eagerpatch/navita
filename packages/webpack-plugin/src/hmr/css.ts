declare const __webpack_require__: {
  navitaDevHash(): string;
};

let previousHash = __webpack_require__.navitaDevHash();

type LinkElement = HTMLLinkElement & {
  loaded?: boolean;
};

export function css() {
  const currentHash = __webpack_require__.navitaDevHash();

  if (previousHash === currentHash) {
    return;
  }

  previousHash = currentHash;

  const styleSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((element) => [element.getAttribute('href').split('?')[0], element as LinkElement] as const);

  const targets = styleSheets.filter(([href]) => href.endsWith('navita.css'));

  console.log('[Navita HMR] Reloading %s stylesheet.', targets.length === 0 ? 'all': 'navita');

  for (const [href, element] of targets.length > 0 ? targets : styleSheets) {
    if (element.loaded === false) {
      continue;
    }

    const newElement = element.cloneNode() as LinkElement;
    newElement.loaded = false;

    const handler = () => {
      if (newElement.loaded) {
        return;
      }

      newElement.loaded = true;
      element.remove();
    }

    newElement.addEventListener('load', handler);
    newElement.addEventListener('error', handler);
    newElement.setAttribute('href', `${href}?${Date.now()}`);

    if (element.nextSibling) {
      element.parentNode.insertBefore(newElement, element.nextSibling);
    } else {
      element.parentNode.appendChild(element);
    }
  }
}
