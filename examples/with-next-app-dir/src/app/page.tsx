import { style } from "@navita/css";

const container = style({
  background: 'orange',
  color: 'black',
  fontSize: '2rem',
  padding: '1rem',
});

export default function Home() {
  return (
    <main className={container}>
      App Dir.
    </main>
  );
}
