import { style } from '@navita/css';

const x = style({
  background: 'purple',
});

export default function Edge() {
  return (
    <main>
      <div className={x}>Edge.</div>
    </main>
  );
}

export const runtime = 'edge';
