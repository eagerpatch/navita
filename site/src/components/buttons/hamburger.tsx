"use client";

import { merge, style } from "@navita/css";
import { useEffect } from "react";
import { vars } from "@/components/layout/theme";

const button = style({
  background: "transparent",
  cursor: "pointer",
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: "column",
  justifyContent: "center",
  gap: 6
});

const bar = style({
  display: "inline",
  width: "27px",
  height: "5px",
  borderRadius: 5,
  backgroundColor: `hsl(${vars.colors.foreground})`,
  transition: "0.3s ease"
});

const bar1Active = style({
  transform: "translate(0, 11px) rotate(-45deg)"
});

const bar2Active = style({
  opacity: 0
});

const bar3Active = style({
  transform: "translate(0, -11px) rotate(45deg)"
});

interface Props {
  className?: string;
  onClick?: () => void;
  isOpen?: boolean;
}

export const Hamburger = ({ className, isOpen, onClick }: Props) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.setProperty("overflow", "hidden");
    } else {
      document.body.style.removeProperty("overflow");
    }
  }, [isOpen]);

  return (
    <button
      aria-expanded={isOpen}
      className={merge(button, className)}
      onClick={onClick}
    >
      <span className={merge(bar, isOpen && bar1Active)} />
      <span className={merge(bar, isOpen && bar2Active)} />
      <span className={merge(bar, isOpen && bar3Active)} />
    </button>
  );
}
