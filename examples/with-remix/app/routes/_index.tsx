import { style } from "@navita/css";
import type { MetaFunction } from "@remix-run/node";
import { Box } from "~/components/box";
import { Button } from "~/components/button";
import { Specificity } from "~/components/specificity";
import { background } from "~/consts";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

const x = style({
  color: 'white',
  backgroundColor: background,
});

export default function Index() {


  return (
    <div className={x}>
      Testing
      <Specificity />
      <Button>Testing</Button>

      <Box>Hello</Box>
    </div>
  );
}
