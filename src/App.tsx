import {createSignal, Show} from 'solid-js';
import type {Component} from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';

import testimage from './testimages/photock-photo0000-1921.png';
import Nop from './effects/nop';

const App: Component<{}> = (_) => {
  const srcImage = document.createElement("img")!;
  srcImage.src = testimage;
  const [visibleNop, setVisibilityNop] = createSignal(false);
  const setVisibleNop = () => {setVisibilityNop(true)};

  return (
    <div class={styles.App}>
      <img src={testimage} />
      <Show when={visibleNop()} fallback={<a onClick={setVisibleNop} href="#">Nop</a>}>
        Nop
        <Nop src={srcImage} />
      </Show>
    </div>
  );
};

export default App;
