import { style } from "@navita/css";
import React from "react";

const button = style({
  fontSize: '1rem',
  padding: '5px',
  borderRadius: '4px',
  background: 'hotpink',
  color: 'white',
  textTransform: 'uppercase',
  fontWeight: 'bold',
  border: '1px solid black',
  boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)',
});

type ButtonProps = JSX.IntrinsicElements['button'];

interface Props extends ButtonProps {
  children: React.ReactNode;
}

export const Button = ({ children, ...rest }: Props) => (
  <button className={button} {...rest}>{children}</button>
);
