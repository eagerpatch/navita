'use client';

import { style } from "@navita/css";
import { vars } from "@/components/layout/theme";

export const ghost = style({
  display: 'inline-flex',
  height: '2.5rem',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: `calc(${vars.radius} - 2px)`,
  paddingTop: '0.5rem',
  paddingBottom: '0.5rem',
  paddingLeft: '1rem',
  paddingRight: '1rem',
  fontSize: '.875rem',
  lineHeight: '1.25rem',
  fontWeight: 500,

  transitionDuration: '.15s',
  transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
  transitionProperty: 'color,background-color,border-color,text-decoration-color,fill,stroke',

  ':hover': {
    color: `hsl(${vars.colors.accentForeground})`,
    backgroundColor: `hsl(${vars.colors.accent})`,
  }
});
