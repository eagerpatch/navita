import { createGlobalTheme, globalStyle, assignVars } from "@navita/css";

export const vars = createGlobalTheme(":root", {
  maxWidth: "1100px",
  borderRadius: "12px",
  fontMono: "ui-monospace, Menlo, Monaco, 'Cascadia Mono', 'Segoe UI Mono', 'Roboto Mono', 'Oxygen Mono', 'Ubuntu Monospace', 'Source Code Pro', 'Fira Mono', 'Droid Sans Mono', 'Courier New', monospace",
  foregroundRgb: "0, 0, 0",
  backgroundStartRgb: "214, 219, 220",
  backgroundEndRgb: "255, 255, 255",
  primaryGlow: "conic-gradient(from 180deg at 50% 50%, #16abff33 0deg, #0885ff33 55deg, #54d6ff33 120deg, #0071ff33 160deg, transparent 360deg)",
  secondaryGlow: "radial-gradient(rgba(255, 255, 255, 1), rgba(255, 255, 255, 0))",
  tileStartRgb: "239, 245, 249",
  tileEndRgb: "228, 232, 233",
  tileBorder: `conic-gradient(
    #00000080,
    #00000040,
    #00000030,
    #00000020,
    #00000010,
    #00000010,
    #00000080
  )`,
  calloutRgb: "238, 240, 241",
  calloutBorderRgb: "172, 175, 176",
  cardRgb: "180, 185, 188",
  cardBorderRgb: "131, 134, 135"
});

globalStyle(":root", {
  "@media (prefers-color-scheme: dark)": {
    ...assignVars(vars, {
      foregroundRgb: "255, 500, 255",
      backgroundEndRgb: "0, 0, 0",
      backgroundStartRgb: "0, 0, 0",
//    borderRadius: vars.borderRadius,
      borderRadius: "12px",
      calloutBorderRgb: "108, 108, 108",
      calloutRgb: "20, 20, 20",
      cardBorderRgb: "200, 200, 200",
      cardRgb: "100, 100, 100",
      // fontMono: vars.fontMono,
      fontMono: "ui-monospace, Menlo, Monaco, 'Cascadia Mono', 'Segoe UI Mono', 'Roboto Mono', 'Oxygen Mono', 'Ubuntu Monospace', 'Source Code Pro', 'Fira Mono', 'Droid Sans Mono', 'Courier New', monospace",
      // maxWidth: vars.maxWidth,
      maxWidth: "1100px",
      primaryGlow: "radial-gradient(rgba(1, 65, 255, 0.4), rgba(1, 65, 255, 0))",
      secondaryGlow: `linear-gradient(
        to bottom right,
        rgba(1, 65, 255, 0),
        rgba(1, 65, 255, 0),
        rgba(1, 65, 255, 0.3)
      )`,
      tileBorder: `conic-gradient(
        #ffffff80,
        #ffffff40,
        #ffffff30,
        #ffffff20,
        #ffffff10,
        #ffffff10,
        #ffffff80
      );`,
      tileEndRgb: "2, 5, 19",
      tileStartRgb: "2, 13, 46"
    })
  }
});
