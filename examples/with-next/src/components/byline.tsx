import { style } from "@navita/css";
import Image from "next/image";

const link = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '0.5rem',

  '@media (max-width: 700px)': {
    padding: '1rem',
  }
});

const logo = style({
  '@media (prefers-color-scheme: dark)': {
    filter: 'invert(1)',
  },
});

export const Byline = () => (
  <a
    href="https://vercel.com"
    target="_blank"
    rel="noopener noreferrer"
    className={link}
  >
    By{' '}
    <Image
      src="/vercel.svg"
      alt="Vercel Logo"
      className={logo}
      width={100}
      height={24}
      priority
    />
  </a>
);
