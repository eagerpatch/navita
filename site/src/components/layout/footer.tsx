import { style } from "@navita/css";
import { Container } from "@/components/container";
import { Eagerpatch } from "@/components/logos/eagerpatch";

const footer = style({
  borderTopWidth: '1px',
});

const container = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexDirection: 'column',
  gap: '1rem',
  paddingTop: '2.5rem',
  paddingBottom: '2.5rem',
  '@media (min-width: 768px)': {
    paddingTop: 0,
    paddingBottom: 0,
    flexDirection: 'row',
    height: '6rem',
  }
});

const p = style({
  fontSize: '0.875rem',
  lineHeight: 2,
  textAlign: 'center',
  '@media (min-width: 768px)': {
    textAlign: 'left',
  }
})

export const Footer = () => (
  <footer className={footer}>
    <Container className={container}>
      <p className={p}>
        MIT Licenced - A project by
        <a href="https://eagerpatch.com" target="_blank">
          <Eagerpatch />
        </a>
      </p>
      <p className={p}>
        Made with 💜 by <a href="https://github.com/zn4rk" target="_blank">@zn4rk</a>
      </p>
    </Container>
  </footer>
);
