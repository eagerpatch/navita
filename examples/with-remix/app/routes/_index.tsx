import type { MetaFunction } from "@remix-run/node";
import { style } from "@navita/css";
import { background } from "~/consts";
import { Button } from "~/components/button";
import { Box } from "~/components/box";

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
      <Button>Testing</Button>

      <Box>Hello</Box>
    </div>
  );
}
