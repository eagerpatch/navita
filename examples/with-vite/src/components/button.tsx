import { style } from "@navita/css";
import React from "react";

const styles = {
  button: style({
    background: 'red',
    color: 'white',
    padding: '10px',
  }),
}

interface Props {
  children: React.ReactNode;
}

export const Button = ({ children }: Props) => (
  <button className={styles.button}>{children}</button>
);
