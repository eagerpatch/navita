import { style } from '@navita/css';
import { useState } from 'react';
import { Button } from "./components/button.tsx";

const x = style({
  background: 'orange',
  color: 'blue',
});

const button = style({
  background: 'lawngreen',
});

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className={x}>
      Hello
      <button className={button} onClick={() => setCount(count + 1)}>Count: {count}</button>

      <Button>Hello</Button>
    </div>
  );
}

export default App;
