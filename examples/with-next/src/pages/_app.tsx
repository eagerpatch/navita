import "@/theme";
import { globalStyle } from "@navita/css";
import type { AppProps } from 'next/app';
import { vars } from "@/theme";

globalStyle("*", {
  boxSizing: 'border-box',
  padding: 0,
  margin: 0,
});

globalStyle("html, body", {
  maxWidth: '100vw',
  overflowX: 'hidden',
});

globalStyle("body", {
  color: `rgb(${vars.foregroundRgb})`,
  background: `linear-gradient(
      to bottom,
      transparent,
      rgb(${vars.backgroundEndRgb})
    )
    rgb(${vars.backgroundStartRgb})
  `,
});

globalStyle("a", {
  color: 'inherit',
  textDecoration: 'none',
});

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
