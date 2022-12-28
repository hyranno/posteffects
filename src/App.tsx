import {createSignal, Show} from 'solid-js';
import type {Component} from 'solid-js';

import styles from './App.module.css';

import testimage from 'testimages/Pexels Videos 2053100.mp4'
import Nop from 'previews/nop';
import HalfToneLike from 'previews/halftone';
import Dither from 'previews/dither';
import Blur from 'previews/blur';
import Bloom from 'previews/bloom';
import Glare from 'previews/glare';
import Halo from 'previews/halo';
import Wavelet from 'previews/wavelet';

const App: Component<{}> = (_) => {
  const[frame, setFrame] = createSignal(-1);

  const srcImage = document.createElement("video")!;
  srcImage.setAttribute("controls", "true");
  srcImage.onplay = (_) => { //onloadeddata
    srcImage.width = srcImage.videoWidth;
    srcImage.height = srcImage.videoHeight;
    setVisibile(true);
  };
  srcImage.ontimeupdate = (_) => setFrame(frame()+1);
  srcImage.src = testimage;

  const [visible, setVisibile] = createSignal(false);

  return (
    <div class={styles.App}>
      {srcImage}
      <Show when={visible()}>
        <Nop src={srcImage} update={frame} />
        <HalfToneLike src={srcImage} update={frame}/>
        <Dither src={srcImage} update={frame} />
        <Blur src={srcImage} update={frame} />
        <Bloom src={srcImage} update={frame} />
        <Glare src={srcImage} update={frame} />
        <Halo src={srcImage} update={frame} />
        <Wavelet src={srcImage} update={frame} />
      </Show>
    </div>
  );
};

export default App;
