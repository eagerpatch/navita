import { style } from "@navita/css";

const container = style({
  background: 'royalblue',
  color: 'white',
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
