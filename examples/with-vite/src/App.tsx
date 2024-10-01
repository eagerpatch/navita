import { style } from '@navita/css';
import { useState } from 'react';

const x = style({
  background: 'red',
  color: 'blue',
});

const button = style({
  background: 'green',
});

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className={x}>
      Hello
      <button className={button} onClick={() => setCount(count + 1)}>Count: {count}</button>
    </div>
  );
}

export default App;
