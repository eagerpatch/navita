import { style } from "@navita/css";

const main = style({
  paddingTop: '1.5rem',
  paddingBottom: '1.5rem',
  position: 'relative',
  '@media (min-width: 1024px)': {
    paddingTop: '2.5rem',
    paddingBottom: '2.5rem',
    gap: '2.5rem',
  },
  '@media (min-width: 1280px)': {
    display: 'grid',
    gridTemplateColumns: '1fr 200px',
  }
});

interface Props {
  children?: React.ReactNode;
}

export const Main = ({ children }: Props) => (
  <main className={main}>
    {children}
  </main>
);
