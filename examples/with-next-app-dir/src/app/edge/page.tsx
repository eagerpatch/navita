import { style } from "@navita/css";
import x from './page.module.css';

const y = style({
  background: 'orange',
});

export default function Edge() {
  return (
    <main>
      <div className={x.something}>
        Edges
      </div>
      <div className={y}>
        Edgesred
      </div>
    </main>
  );
}

export const runtime = 'edge';
