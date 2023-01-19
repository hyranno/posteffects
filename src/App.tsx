import {createSignal, Show} from 'solid-js';
import type {Component} from 'solid-js';

import styles from './App.module.css';

import testimage from 'testimages/Pexels Videos 2053100.mp4'
import Stack from 'previews/stack';

const App: Component<{}> = (_) => {
  const[frame, setFrame] = createSignal(-1);

  const srcImage = document.createElement("video")!;
  srcImage.setAttribute("controls", "true");
  srcImage.onloadeddata = () => { // srcImage.onloadeddata
    srcImage.width = srcImage.videoWidth;
    srcImage.height = srcImage.videoHeight;
    setVisibile(true);
  };
  setInterval( // srcImage.ontimeupdate
    () => setFrame(frame()+1),
    1000/30
  );
  srcImage.src = testimage;

  const [visible, setVisibile] = createSignal(false);

  return (
    <div class={styles.App}>
      {srcImage}
      <Show when={visible()}>
        <Stack src={srcImage} update={frame} />
      </Show>
    </div>
  );
};

export default App;
