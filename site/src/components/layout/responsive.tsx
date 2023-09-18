import { style } from "@navita/css";

const responsive = style({
  '@media (min-width: 1024px)': {
    gap: '2.5rem',
  },
  '@media (min-width: 768px)': {
    gap: '1.5rem',
    gridTemplateColumns: '250px 1fr',
    display: 'grid',
  },
  flex: '1 1 0%',
});

interface Props {
  children: React.ReactNode;
}

export const Responsive = ({ children }: Props) => (
  <div className={responsive}>{children}</div>
);
