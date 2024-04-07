import { style } from "@navita/css";
import x from './page.module.css';

const y = style({
  background: 'yellow',
});

export default function Edge() {
  return (
    <main>
      <div className={x.something}>
        Edges
      </div>
      <div className={y}>
        Edge hejsasss
      </div>
    </main>
  );
}

export const runtime = 'edge';
