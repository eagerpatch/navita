import { style } from "@navita/css";
import React from "react";
import { vars } from "@/theme";

const container = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(25%, auto))',
  width: vars.maxWidth,
  maxWidth: '100%',
  '@media (max-width: 700px)': {
    gridTemplateColumns: '1fr',
    marginBottom: '120px',
    maxWidth: '320px',
    textAlign: 'center',
  },
  '@media (min-width: 701px) and (max-width: 1120px)': {
    gridTemplateColumns: 'repeat(2, 50%)',
  }
});

interface Props {
  children: React.ReactNode;
}

export const Grid = ({ children }: Props) => (
  <div className={container}>
    {children}
  </div>
);
