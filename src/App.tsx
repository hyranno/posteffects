import {createSignal, Show} from 'solid-js';
import type {Component} from 'solid-js';

import styles from './App.module.css';

import testimage from 'testimages/photock-photo0000-1921.png';
import Nop from 'effects/nop';
import HalfToneLike from 'effects/halftone';
import Dither from 'effects/dither';

const App: Component<{}> = (_) => {
  const srcImage = document.createElement("img")!;
  srcImage.src = testimage;

  const [visibleNop, setVisibileNop] = createSignal(false);
  const toggleVisibleNop = () => {setVisibileNop(!visibleNop())};

  const [visibleHalftone, setVisibileHalftone] = createSignal(false);
  const toggleVisibleHalftone = () => {setVisibileHalftone(!visibleHalftone())};

  const [visibleDither, setVisibileDither] = createSignal(false);
  const toggleVisibleDither = () => {setVisibileDither(!visibleDither())};

  return (
    <div class={styles.App}>
      <img src={testimage} />
      <div>
        <a onClick={toggleVisibleNop} href="#">Nop</a>
      </div>
      <Show when={visibleNop()}>
        <Nop src={srcImage} />
      </Show>
      <div>
        <a onClick={toggleVisibleHalftone} href="#">HalfTone like</a>
      </div>
      <Show when={visibleHalftone()}>
        <HalfToneLike src={srcImage} />
      </Show>
      <div>
        <a onClick={toggleVisibleDither} href="#">Dither</a>
      </div>
      <Show when={visibleDither()}>
        <Dither src={srcImage} />
      </Show>
    </div>
  );
};

export default App;
