import { keyframes, style } from "@navita/css";
import Image from "next/image";
import { vars } from "@/theme";

const center = style({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  padding: "4rem 0",

  "::before, ::after": {
    content: "",
    left: "50%",
    position: "absolute",
    filter: "blur(45px)",
    transform: "translateZ(0)",
  },

  "::before": {
    background: vars.secondaryGlow,
    borderRadius: "50%",
    width: "480px",
    height: "360px",
    marginLeft: "-400px"
  },

  "@media (max-width: 700px)": {
    padding: "8rem 0 6rem",
    "::before": {
      transform: "none",
      height: "300px"
    }
  },

  "::after": {
    background: vars.primaryGlow,
    width: "240px",
    height: "180px",
    zIndex: "-1"
  }
});

const logo = style({
  position: "relative",
  '@media (prefers-color-scheme: dark)': {
    filter: 'invert(1) drop-shadow(0 0 0.3rem #ffffff70)',
  }
});

const rotate = keyframes({
  from: {
    transform: "rotate(360deg)"
  },
  to: {
    transform: "rotate(0deg)"
  }
});

const thirteen = style({
  position: "relative",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "75px",
  height: "75px",
  padding: "25px 10px",
  marginLeft: "16px",
  transform: "translateZ(0)",
  borderRadius: vars.borderRadius,
  overflow: "hidden",
  boxShadow: "0px 2px 8px -1px #0000001a",
  "::before, ::after": {
    content: '',
    position: "absolute",
    zIndex: -1,
  },
  "::before": {
    animation: `6s ${rotate} linear infinite`,
    width: "200%",
    height: "200%",
    background: vars.tileBorder
  },
  "::after": {
    inset: 0,
    padding: "1px",
    borderRadius: vars.borderRadius,
    background: `linear-gradient(
      to bottom right,
      rgba(${vars.tileStartRgb}, 1),
      rgba(${vars.tileEndRgb}, 1)
    )`,
    backgroundClip: "content-box"
  }
});

export const Hero = () => (
  <div className={center}>
    <Image
      className={logo}
      src="/next.svg"
      alt="Next.js Logo"
      width={180}
      height={37}
      priority
    />
    <div className={thirteen}>
      <Image
        className={logo}
        src="/thirteen.svg"
        alt="13"
        width={40}
        height={31}
        priority
      />
    </div>
  </div>
);
