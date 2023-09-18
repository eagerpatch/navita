import { merge, style } from "@navita/css";

const svg = style({
  width: '110px',
  display: 'inline',
  marginLeft: '0.5rem',
});

export const Eagerpatch = ({ className, ...rest }: React.SVGProps<SVGSVGElement>) => (
  <svg
    className={merge(svg, className)}
    viewBox="0 0 354.74 64"
    {...rest}
  >
    <use href="/eagerpatch.svg#eagerpatch" />
  </svg>
);
