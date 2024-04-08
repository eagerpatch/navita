import { style } from "@navita/css";

const y = style({
  background: 'dimgray',
});

export default function Edge() {
  return (
    <main>
      <div className={y}>
        Edge
      </div>
    </main>
  );
}

export const runtime = 'edge';
