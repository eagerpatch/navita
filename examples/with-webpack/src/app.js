import { style } from "@navita/css";
import React from 'react';
import './styles.css';
import { background } from "./colors.js";

const container = style({
  color: 'orange',
  margin: '10px',
  fontSize: '50px',
  padding: '20px',
  background: background,
  '@supports (display: grid)': {
    '@media (min-width: 500px)': {
      color: 'green'
    },
    color: 'blue'
  }
});

export const App = () => (
  <div className={container}>
    Hello World!
  </div>
);
