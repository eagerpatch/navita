import { style } from "@navita/css";
import React from "react";
import { vars } from "@/theme";

const code = style({
  fontFamily: vars.fontMono,
  color: 'white',
  borderRadius: '0.25rem',
  padding: '0.25rem',
  fontWeight: 'bold',
});

interface Props {
  children: React.ReactNode;
}

export const Code = ({ children }: Props) => <code className={code}>{children}</code>;
