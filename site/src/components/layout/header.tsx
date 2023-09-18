import { style } from "@navita/css";
import { Github } from "@/components/icons/github";
import { vars } from "@/components/layout/theme";
import { Navita } from "@/components/logos/navita";

const header = style({
  height: vars.header.height,
  display: 'flex',
  backgroundColor: `hsl(${vars.colors.background})`,
  width: '100%',
  zIndex: 40,
  top: 0,
  position: 'sticky',
});

const container = style({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  marginRight: '2.75rem',
  justifyContent: 'space-between',
  paddingLeft: '1rem',
  paddingRight: '1rem',
  '@media (min-width: 768px)': {
    marginLeft: 'auto',
    marginRight: 'auto',
    justifyContent: 'space-between',
  }
});

export const Header = () => (
  <header className={header}>
    <div className={container}>
      <Navita />

      <a target="_blank" href="https://github.com/eagerpatch/navita">
        <Github />
      </a>
    </div>
  </header>
);
