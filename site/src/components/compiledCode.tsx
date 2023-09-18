"use client";

import { merge, style } from "@navita/css";
import { useCallback, useState } from "react";
import { vars } from "@/components/layout/theme";

type Selection = 'input' | 'css' | 'compiled';

type Input = React.ReactNode;
type Css = React.ReactNode;
type Compiled = React.ReactNode;

const container = style({
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  marginTop: '1.5rem',
  marginBottom: '1rem',
  borderWidth: 1,
  borderRadius: vars.radius,
  '& pre': {
    marginTop: 0,
    marginBottom: 0,
    borderWidth: 0,
  }
});

const header = style({
  display: 'flex',
  alignItems: 'center',
  background: `hsl(${vars.colors.muted})`,
  borderBottomWidth: 1,
  paddingLeft: '1rem',
  fontSize: '0.875rem',
});

const tabs = style({
  marginLeft: 'auto',
});

const tab = style({
  font: vars.fonts.sans,
  cursor: 'pointer',
  background: 'transparent',
  padding: '0.75rem',
  color: 'white',
});

const tabActive = style({
  background: `hsla(${vars.colors.accent}, 0.4)`,
});

type Button = JSX.IntrinsicElements['button'];

interface TabProps extends Button {
  children: React.ReactNode;
  active?: boolean;
}

const Tab = ({ children, active, ...rest }: TabProps) => (
  <button
    {...rest}
    className={merge(tab, active && tabActive)}
  >
    {children}
  </button>
);

interface Props {
  filename: string;
  children: [
    Input,
    Css,
    Compiled,
  ],
}

export const CompiledCode = ({ filename, children }: Props) => {
  const [selection, setSelection] = useState<Selection>('input');
  const [input, css, output] = children;

  const handleTabClick = useCallback((selection: Selection) => () => {
    setSelection(selection);
  }, []);

  return (
    <div className={container}>
      <div className={header}>
          {filename}
        <div className={tabs}>
          <Tab
            onClick={handleTabClick('input')}
            active={selection === 'input'}
          >
            Input
          </Tab>
          <Tab
            onClick={handleTabClick('css')}
            active={selection === 'css'}
          >
            CSS
          </Tab>
          <Tab
            onClick={handleTabClick('compiled')}
            active={selection === 'compiled'}
          >
            Compiled
          </Tab>
        </div>
      </div>
      <div>
        {selection === 'input' && input}
        {selection === 'css' && css}
        {selection === 'compiled' && output}
      </div>
    </div>
  );
}
