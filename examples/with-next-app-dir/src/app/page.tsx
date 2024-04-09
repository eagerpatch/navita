import { style } from "@navita/css";

const container = style({
  background: 'moccasin',
  color: 'orange',
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
