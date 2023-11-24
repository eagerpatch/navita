import { style } from "@navita/css";

const button = style({
  all: 'unset',
  background: 'orange',
});

export default function Temp() {
  return <button className={button}>Temp</button>;
}
