import {createSignal, createEffect, For} from 'solid-js';
import type {Component, Accessor, Setter} from 'solid-js';


export abstract class SignalingInput<T> {
  accessor: Accessor<T>;
  setter: Setter<T>;
  inputs: Component;
  constructor(v: T, inputs: Component) {
    [this.accessor, this.setter] = createSignal(v);
    this.inputs = inputs;
  }
}

export class SignalingInputInt extends SignalingInput<number> {
  constructor(v: number) {
    let inputs: Component<{}> = () => {
      return <>
        <input type="number" step="1"
          value={this.accessor()}
          onInput={e => this.setter(parseInt(e.currentTarget.value))}
        />
      </>;
    };
    super(v, inputs);
  }
}
export class SignalingInputFloat extends SignalingInput<number> {
  constructor(v: number) {
    let inputs: Component<{}> = () => {
      return <>
        <input type="number" step="0.1"
          value={this.accessor()}
          onInput={e => this.setter(parseFloat(e.currentTarget.value))}
        />
      </>;
    };
    super(v, inputs);
  }
}

export class SignalingInputVec<
  T extends number[], C extends SignalingInput<number>
> extends SignalingInput<T> {
  constructor(v: T, partConstructor: (new (vi: number) => C)) {
    let parts = v.map(vi => new partConstructor(vi));
    createEffect(() => this.setter(
      () => parts.map(p => p.accessor()) as T
    ));
    let inputs: Component<{}> = () => {
      return <>
        <For each={parts}>
          {p => p.inputs({})}
        </For>
      </>;
    };
    super(v, inputs);
  }
}
