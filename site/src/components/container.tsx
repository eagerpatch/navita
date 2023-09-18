import { merge, style } from "@navita/css";

const container = style({
  width: '100%',
  flex: 1,
  marginLeft: 'auto',
  marginRight: 'auto',
  paddingLeft: '1rem',
  paddingRight: '1rem',
  '@media (min-width: 1400px)': {
    maxWidth: '1400px',
  },
});

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const Container = ({ children, className }: Props) => (
  <div className={merge(container, className)}>{children}</div>
)
