import { style } from "@navita/css";
import { Inter } from "next/font/google";
import React from "react";
import { vars } from "@/theme";

const inter = Inter({ subsets: ['latin'] })

const container = style({
  padding: '1rem 1.2rem',
  borderRadius: vars.borderRadius,
  background: `rgba(${vars.cardRgb}, 0)`,
  border: `1px solid rgba(${vars.cardBorderRgb}, 0)`,
  transition: 'background 200ms, border 200ms',
  ':hover': {
    background: `rgba(${vars.cardRgb}, 0.1)`,
    border: `1px solid rgba(${vars.cardBorderRgb}, 0.15)`,
    '& span': {
      transform: 'translateX(0.2rem)',
    },
  },
  '@media (max-width: 700px)': {
    padding: '1rem 2.5rem',
  }
});

const span = style({
  display: 'inline-block',
  transition: 'transform 200ms',
});

const h2 = style({
  fontWeight: 600,
  marginBottom: '0.7rem',
  '@media (max-width: 700px)': {
    marginBottom: '0.5rem',
  }
});

const p = style({
  margin: 0,
  opacity: 0.6,
  fontSize: '0.9rem',
  lineHeight: 1.5,
  maxWidth: '30ch',
});

interface Props {
  href?: string;
  title?: string;
  description?: string;
}

export const Card = ({ href, title, description }: Props) => (
  <a
    href={href}
    className={container}
    target="_blank"
    rel="noopener noreferrer"
  >
    <h2 className={[h2, inter.className].join(' ')}>
      {title} <span className={span}>-&gt;</span>
    </h2>
    <p className={[p, inter.className].join(' ')}>{description}</p>
  </a>
);
