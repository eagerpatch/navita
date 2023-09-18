import { style } from "@navita/css";
import React from "react";
import { vars } from "@/theme";

const description = style({
  display: 'inherit',
  justifyContent: 'inherit',
  alignItems: 'inherit',
  fontSize: '0.85rem',
  maxWidth: vars.maxWidth,
  width: '100%',
  zIndex: 2,
  fontFamily: vars.fontMono,

  '@media (max-width: 700px)': {
    fontSize: '0.8rem',
  }
});

const p = style({
  position: 'relative',
  margin: 0,
  padding: '1rem',
  backgroundColor: `rgba(${vars.calloutRgb}, 0.5)`,
  border: `1px solid rgba(${vars.calloutBorderRgb}, 0.3)`,
  borderRadius: vars.borderRadius,

  '@media (max-width: 700px)': {
    alignItems: 'center',
    inset: '0 0 auto',
    padding: '2rem 1rem 1.4rem',
    borderRadius: 0,
    border: 'none',
    borderBottom: `1px solid rgba(${vars.calloutBorderRgb}, 0.25)`,
    background: `linear-gradient(
      to bottom,
      rgba(${vars.backgroundStartRgb}, 1),
      rgba(${vars.calloutRgb}, 0.5)
    )`,
    backgroundClip: 'padding-box',
    backdropFilter: 'blur(24px)',
  },
});

const sharedMedia = style({
  '@media (max-width: 700px)': {
    display: 'flex',
    justifyContent: 'center',
    position: 'fixed',
    width: '100%',
  }
});

const div = style({
  '@media (max-width: 700px)': {
    alignItems: 'flex-end',
    pointerEvents: 'none',
    inset: 'auto 0 0',
    padding: '2rem',
    height: '200px',
    background: `linear-gradient(
      to bottom,
      transparent 0%,
      rgb(${vars.backgroundEndRgb}) 40%
    )`,
    zIndex: 1,
  }
});

interface Props {
  left: React.ReactNode;
  right: React.ReactNode;
}

export const Description = ({ left, right }: Props) => (
  <div className={description}>
    <p className={[p, sharedMedia].join(' ')}>
      {left}
    </p>
    <div className={[div, sharedMedia].join(' ')}>
      {right}
    </div>
  </div>
);
