import { style } from "@navita/css";

const box = style({
  background: 'hotpink',
  color: 'white',
  fontSize: 20,
  padding: 20,
});

interface Props {
  children: React.ReactNode;
}

export const Box = ({ children }: Props) => (
  <div className={box}>
    {children}
  </div>
);
