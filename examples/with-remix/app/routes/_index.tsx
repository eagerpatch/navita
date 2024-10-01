import type { MetaFunction } from "@remix-run/node";
import { style } from "@navita/css";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

const styles = {
  container: style({
    background: 'hotpink',
  }),
  h1: style({
    color: 'blue',
  }),
}

export default function Index() {
  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Welcome to Remix!</h1>
    </div>
  );
}
