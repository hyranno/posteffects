## これは?
WebGL向けポストエフェクト集です。
セレクトボックスからエフェクトを選んで+で追加。
エフェクト名をクリックしてパラメータの調整や削除ができます。
複数のエフェクトを重ねることもできます。

ポストエフェクトは主にGLSLで書かれており、後で移植する前提でここに書き溜めています。
UnityのShaderGraphに移植となるとやや手間かも知れませんが、アルゴリズム自体は役立つはずです。

BlurやEdgeが1次元のフィルタで構成されていたり、
Mosaicがモンテカルロ的なサンプリングで近似されていたりと、
高解像度での計算量を意識して実装しています。

## 技術スタック
TypeScript + SolidJS + WebGL
