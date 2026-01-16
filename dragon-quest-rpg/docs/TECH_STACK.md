# 技術スタック

## 概要

本プロジェクト「ドラクエ風RPG」は、ブラウザ上で動作するHTML5ベースの2D RPGゲームです。外部ライブラリに依存せず、Pure JavaScript で実装されています。

---

## 技術構成

### フロントエンド

| 技術 | バージョン/詳細 | 用途 |
|------|-----------------|------|
| **HTML5** | - | ゲーム構造、UI要素 |
| **CSS3** | - | UIスタイリング、アニメーション |
| **JavaScript (ES6+)** | Vanilla JS | ゲームロジック全体 |
| **Canvas API** | 2D Context | ゲーム描画エンジン |
| **Web Audio API** | AudioContext | サウンドシステム（SE・BGM） |
| **LocalStorage API** | - | セーブデータ永続化 |

### ビルドツール

本プロジェクトはビルドツールを使用せず、単一の`index.html`ファイルで完結しています。

- バンドラー: **未使用**
- トランスパイラー: **未使用**
- CSSプリプロセッサ: **未使用**

---

## ファイル構成

```
dragon-quest-rpg/
├── index.html          # メインHTML（ゲーム本体、約12,000行）
├── index.html.step1    # 開発中間バージョン（バックアップ）
├── index.html.step2    # 開発中間バージョン（バックアップ）
├── maps/               # マップデータ（JSON形式）
│   ├── field.json
│   ├── castle.json
│   ├── town.json
│   ├── dungeon.json
│   ├── ... (55ファイル)
├── se/                 # サウンドエフェクト・BGM（MP3形式）
│   ├── battle.mp3
│   ├── field.mp3
│   ├── town.mp3
│   ├── ... (20ファイル)
├── stories/            # ストーリー・設計ドキュメント
│   ├── area3_story.md
│   ├── area4_story.md
│   └── area_planning_draft.md
└── docs/               # 技術ドキュメント
    ├── TECH_STACK.md   # 本ファイル
    ├── ARCHITECTURE.md # アーキテクチャ詳細
    └── GAME_SYSTEMS.md # ゲームシステム詳細
```

---

## 外部依存

### ゼロ依存

本プロジェクトは外部ライブラリやフレームワークを**一切使用していません**。

- Node.js 不要
- npm パッケージ 不要
- CDN 不要

### 理由

1. **可搬性**: 任意のWebサーバーで即座に実行可能
2. **保守性**: 依存関係の更新による破壊的変更がない
3. **学習**: Vanilla JavaScript の深い理解を促進
4. **軽量**: ファイルサイズの最小化

---

## サポート環境

### ブラウザ対応

| ブラウザ | バージョン | 対応状況 |
|----------|------------|----------|
| Chrome | 60+ | ✅ 完全対応 |
| Firefox | 55+ | ✅ 完全対応 |
| Safari | 12+ | ✅ 完全対応 |
| Edge | 79+ | ✅ 完全対応 |
| iOS Safari | 12+ | ✅ タッチ対応 |
| Android Chrome | 60+ | ✅ タッチ対応 |

### 入力デバイス

- **キーボード**: 矢印キー、Enter、Escape
- **タッチ**: バーチャルD-Pad、A/Bボタン
- **マウス**: メニュー操作（補助的）

---

## 画面解像度

### レスポンシブ対応

Canvas は動的にサイズ調整され、任意のデバイスに対応します。

```javascript
// Canvas サイズ計算
tileSize = Math.floor(Math.min(width, height) / VISIBLE_TILES);
```

### 基準設計

- **タイルサイズ**: 動的計算（画面サイズ÷表示タイル数）
- **表示タイル数**: 10×10（固定）
- **アスペクト比**: 可変（フルスクリーン描画）

---

## パフォーマンス

### 最適化手法

1. **マップキャッシュ**: 読み込み済みマップをメモリに保持
2. **音声バッファキャッシュ**: デコード済み音声データを再利用
3. **RequestAnimationFrame**: 60FPS目標のレンダリングループ
4. **描画最適化**: 視野内のタイルのみ描画

### 測定データ（参考）

- 初期ロード: 約500KB（HTML + 初回マップ）
- マップ切替: 約5-150KB（マップサイズ依存）
- メモリ使用: 約20-50MB（プレイ中）

---

## 開発環境

### 推奨セットアップ

1. **エディタ**: VS Code（推奨）
2. **ローカルサーバー**: Live Server 拡張機能
3. **デバッグ**: Chrome DevTools

### 起動方法

```bash
# 方法1: Live Server（VS Code）
# index.html を開いて「Go Live」をクリック

# 方法2: Python
python -m http.server 8000

# 方法3: Node.js
npx http-server
```

---

## 更新履歴

- 2026-01-15: 初版作成
