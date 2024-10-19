import { style } from "@navita/css";
import React from "react";

const box = style({
  background: 'green',
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
