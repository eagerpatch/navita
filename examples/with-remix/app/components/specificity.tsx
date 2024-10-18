import { style } from "@navita/css";

const container = style({
  width: 500,
  height: 500,
  background: 'green',

  '@media (min-width: 600px)': {
    background: 'red',
  },
});

export const Specificity = () => (
  <div className={container} />
);
