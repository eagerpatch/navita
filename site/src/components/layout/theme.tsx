import { createGlobalTheme, globalStyle } from "@navita/css";

export const vars = createGlobalTheme(':root', {
  colors: {
    background: '224 71% 4%',
    foreground: '213 31% 91%',
    primary: '210 40% 98%',
    primaryForeground: '222.2 47.4% 1.2%',
    muted: '221 39% 11%',
    mutedForeground: '215.4 16.3% 56.9%',
    border: '216 34% 17%',
    accent: '246, 43%, 52%',
    accentForeground: '210 40% 98%',
    eagerpatch: '#fff',
  },
  header: {
    height: '4rem',
  },
  fonts: {
    heading: `var(--next-font-heading),ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"`,
    sans: `var(--next-font-sans),ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"`,
  },
  zIndex: {
    header: 40,
    sidebar: 30,
  },
  radius: '0.5rem',
});

// Reset
globalStyle('blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre', {
  margin: 0,
});

globalStyle('h1,h2,h3,h4,h5,h6', {
  fontSize: 'inherit',
  fontWeight: 'inherit',
});

globalStyle('ul,ol', {
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

globalStyle('img,svg,video,canvas,audio,iframe,embed,object', {
  display: 'block',
  verticalAlign: 'middle',
});

globalStyle('img,video', {
  maxWidth: '100%',
  height: 'auto',
});

globalStyle('a', {
  color: 'inherit',
  textDecoration: 'inherit',
});

globalStyle('*,::before,::after', {
  boxSizing: 'border-box',
  borderWidth: 0,
  borderStyle: 'solid',
});

globalStyle('*', {
  borderColor: `hsl(${vars.colors.border})`,
});

// End reset

globalStyle('html,body', {
  minHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
});

globalStyle('body', {
  margin: 0,
  backgroundColor: `hsl(${vars.colors.background})`,
  color: `hsl(${vars.colors.foreground})`,
  fontFamily: vars.fonts.sans,
  flex: 1,
});

interface Props {
  children: React.ReactNode;
}

export const Theme = ({ children }: Props) => (<>{children}</>);
