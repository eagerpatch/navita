import { style } from "@navita/css";

const button = style({
  background: 'red',
  color: 'white',
  padding: '10px',
});

interface Props {
  children: React.ReactNode;
}

export const Button = ({ children }: Props) => (
  <button className={button}>
    {children}
  </button>
);
