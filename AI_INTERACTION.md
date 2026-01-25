・Bボタンでメニュー画面表示した状態でカーソルキー操作してもやっぱりマップ上のキャラが動いてしまいます。
・宿屋で固まる問題、解決していません
　開発者ツールでコンソールにエラーが発生しています
　engine.js:616 Uncaught TypeError: Cannot read properties of undefined (reading 'length')
    at typeNextChar (engine.js:616:43)
    at startDialog (engine.js:565:5)
    at interact (engine.js:1708:9)
    at onActionA (input.js:535:13)
    at HTMLDivElement.handlePress (input.js:506:9)
　・バトル画面も敵キャラが正しく表示されないのと、コマンドも表示されない。![alt text](image-5.png)

何も解決していない感じです。
この後はどのように進めますか？