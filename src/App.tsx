import {createSignal, Show} from 'solid-js';
import type {Component} from 'solid-js';

import styles from './App.module.css';

import testimage from 'testimages/photock-photo0000-1921.png';
import Nop from 'previews/nop';
import HalfToneLike from 'previews/halftone';
import Dither from 'previews/dither';
import Blur from 'previews/blur';
import Bloom from 'previews/bloom';
import Glare from 'previews/glare';
import Halo from 'previews/halo';
import Wavelet from 'previews/wavelet';

const App: Component<{}> = (_) => {
  const srcImage = document.createElement("img")!;
  srcImage.src = testimage;
  const [visible, setVisibile] = createSignal(false);
  srcImage.onload = (_) => setVisibile(true);

  return (
    <div class={styles.App}>
      <img src={testimage} />
      <Show when={visible()}>
        <Nop src={srcImage} />
        <HalfToneLike src={srcImage} />
        <Dither src={srcImage} />
        <Blur src={srcImage} />
        <Bloom src={srcImage} />
        <Glare src={srcImage} />
        <Halo src={srcImage} />
        <Wavelet src={srcImage} />
      </Show>
    </div>
  );
};

export default App;
