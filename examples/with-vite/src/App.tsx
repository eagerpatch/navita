import { globalStyle } from "@navita/css";
import { useCallback, useState } from "react";
import { Button } from "@/components/button";
import { ComicSansContainer } from "@/components/comicSansContainer.tsx";
import { DynamicStyleExample } from "@/components/dynamicStyleExample.tsx";
import { MergeExample } from "@/components/mergeExample.tsx";
import './App.css';

globalStyle(':root', {
  background: 'floralwhite',
  '@media (prefers-color-scheme: dark)': {
    background: 'royalblue',
    color: 'white',
  }
});

function App() {
  const [counter, setCounter] = useState(0);

  const handleButtonClick = useCallback(() => {
    setCounter((prevState) => prevState + 1);
  }, []);

  return (
    <div>
      <MergeExample />

      <DynamicStyleExample />

      <Button onClick={handleButtonClick}>
        Clicked {counter} times
      </Button>

      <ComicSansContainer>
        This is written with comic sans
      </ComicSansContainer>
    </div>
  );
}

export default App;
