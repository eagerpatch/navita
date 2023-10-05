import { merge, style } from "@navita/css";
import { useState } from "react";

const container = style({
  background: 'hotpink',
  color: 'white',
});

const activeContainer = style({
  background: 'royalblue',
});

export const MergeExample = () => {
  const [isActive, setIsActive] = useState(false);

  return (
    <button
      className={merge(container, isActive && activeContainer)}
      onClick={() => setIsActive((prevState) => !prevState)}
    >
      Toggle Active
    </button>
  );
}
