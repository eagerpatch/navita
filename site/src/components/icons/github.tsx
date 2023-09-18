import { style } from "@navita/css";
import Image from "next/image";

const github = style({
  filter: 'invert(1)',
});

export const Github = () => (
  <Image
    className={github}
    src="/github.svg"
    alt="Github"
    width={28}
    height={28}
  />
);
