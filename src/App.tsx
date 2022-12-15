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

const App: Component<{}> = (_) => {
  const srcImage = document.createElement("img")!;
  srcImage.src = testimage;

  return (
    <div class={styles.App}>
      <img src={testimage} />
      <Nop src={srcImage} />
      <HalfToneLike src={srcImage} />
      <Dither src={srcImage} />
      <Blur src={srcImage} />
      <Bloom src={srcImage} />
      <Glare src={srcImage} />
      <Halo src={srcImage} />
    </div>
  );
};

export default App;
