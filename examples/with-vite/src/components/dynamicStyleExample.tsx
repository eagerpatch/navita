import { style, createVar } from "@navita/css";
import { useState } from "react";

const backgroundColor = createVar("background-color");

const container = style({
  background: backgroundColor,
  padding: 8,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

export const DynamicStyleExample = () => {
  const [dynamicColor, setDynamicColor] = useState("#FF69B4");

  return (
    <div
      className={container}
      style={{
        [backgroundColor]: dynamicColor,
      }}
    >
      <strong>Dynamic styles with CSS vars</strong>
      <input
        type="color"
        value={dynamicColor}
        onChange={(e) => setDynamicColor(e.target.value)}
      />
    </div>
  );
};
