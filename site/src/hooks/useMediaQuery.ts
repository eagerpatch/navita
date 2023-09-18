import { useEffect, useState } from "react";

export function useMediaQuery(query: string, effect?: (matches: boolean) => void): boolean {
  const [matches, setMatches] = useState<boolean>(
    typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    const handleMediaQueryChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
      if (effect) {
        effect(event.matches);
      }
    };

    matchMedia.addEventListener('change', handleMediaQueryChange);

    return () => {
      matchMedia.removeEventListener('change', handleMediaQueryChange);
    }
  }, [effect, query]);

  return matches;
}
