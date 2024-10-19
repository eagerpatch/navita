import { style } from "@navita/css";

const container = style({
  width: 500,
  height: 500,
  background: 'rebeccapurple',

  '@media (min-width: 600px)': {
    background: 'royalblue',
  },
});

export const Specificity = () => (
  <div className={container} />
);
