import { style } from "@navita/css";
import React from "react";

const main = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6rem',
  minHeight: '100vh',
});

interface Props {
  children: React.ReactNode;
}

export const Main = ({ children }: Props) => (
  <main className={main}>{children}</main>
)
