# モジュール分割・リファクタリング完全チェックリスト

## フェーズ1: 分割前の機能カタログ作成

### 1.1 動作している全機能のリスト化
- [ ] タイトル画面
  - [ ] 「はじめから」ボタン
  - [ ] 「つづきから」ボタン（セーブデータがある場合）
  - [ ] サウンド切替ボタン
- [ ] 入力システム
  - [ ] **キーボード入力**（WASD/矢印キー）
  - [ ] **タッチコントロール**（D-pad）
  - [ ] **A/Bボタン**（タッチ/マウス/キーボード）
  - [ ] マップピンボタン
- [ ] プレイヤー操作
  - [ ] 移動（4方向）
  - [ ] 連続移動（長押し）
  - [ ] NPC対話
  - [ ] 宝箱開封
- [ ] バトルシステム
- [ ] セーブ/ロードシステム
- [ ] メニューシステム
- [ ] マップ遷移

### 1.2 イベントリスナーの完全リスト
```bash
# 分割前のコードから全イベントリスナーを抽出
grep -n "addEventListener" index_6c69ad3.html > event_listeners_before.txt
```

### 1.3 公開関数/変数のリスト
```bash
# グローバルスコープの関数をリスト化
grep -n "function " index_6c69ad3.html | grep -v "    function" > functions_before.txt
```

---

## フェーズ2: 分割実施（段階的）

### 2.1 最小単位での分割
1. **1モジュールずつ分割**（一度に全部やらない）
2. 分割後、**即座に動作確認**
3. 問題があれば**ロールバック**

### 2.2 各モジュール分割後のチェック
- [ ] モジュールが正しくインポート/エクスポートされているか
- [ ] 元のHTMLから該当部分が削除されているか
- [ ] **ブラウザで実際に動作確認**

---

## フェーズ3: 分割後の完全性検証

### 3.1 差分駆動レビュー

#### A. イベントリスナーの完全移行確認
```bash
# 分割後のイベントリスナーを抽出
find dragon-quest-rpg/js -name "*.js" -exec grep -Hn "addEventListener" {} \; > event_listeners_after.txt

# 差分確認
diff event_listeners_before.txt event_listeners_after.txt
```

**チェック項目:**
- [ ] `addEventListener`の数が一致しているか
- [ ] D-pad（dpad-up, dpad-down, dpad-left, dpad-right）の4つ
- [ ] A/Bボタン（btn-a, btn-b）の2つ
- [ ] マップピンボタン（mapPinBtn）
- [ ] サウンド切替ボタン
- [ ] タイトルメニューボタン

#### B. 関数の完全移行確認
```bash
# 分割前の関数リスト
grep -oP "function \K\w+" index_6c69ad3.html | sort | uniq > functions_before_list.txt

# 分割後の関数リスト
find dragon-quest-rpg/js -name "*.js" -exec grep -oP "function \K\w+|export function \K\w+" {} \; | sort | uniq > functions_after_list.txt

# 差分確認
comm -23 functions_before_list.txt functions_after_list.txt > missing_functions.txt
```

**重要関数の確認:**
- [ ] `startContinuousMove`
- [ ] `stopContinuousMove`
- [ ] `setupDpadButton`
- [ ] `setupActionButton`
- [ ] `onActionA`
- [ ] `onActionB`
- [ ] `movePlayer`
- [ ] `interact`

---

## フェーズ4: 機能別動作確認

### 4.1 入力システム
- [ ] **キーボード**: WASD/矢印キーでキャラが動く
- [ ] **D-pad**: タッチ/クリックでキャラが動く
- [ ] **D-pad長押し**: 連続移動する
- [ ] **Aボタン**: NPCに話しかけられる
- [ ] **Bボタン**: ダイアログを閉じられる
- [ ] **マップピン**: クリックでマップが開く

### 4.2 タイトル画面
- [ ] 「はじめから」が動作する
- [ ] 「つづきから」が表示される（セーブがある場合）
- [ ] サウンド切替が動作する

### 4.3 ゲーム進行
- [ ] area1でプレイヤーが移動できる
- [ ] NPCと会話できる
- [ ] 戦闘に入れる
- [ ] セーブできる
- [ ] ロードできる

### 4.4 各エリアの確認
- [ ] area1（フィールド）
- [ ] area2（砂漠）
- [ ] area3（地下世界）
- [ ] area4（雪原）
- [ ] area5（海）

---

## フェーズ5: コードレビュー（機能確認後）

### 5.1 静的解析
- [ ] 未使用インポート
- [ ] 循環依存
- [ ] nullチェックの一貫性
- [ ] 重複定義

### 5.2 パフォーマンス
- [ ] メモリリーク
- [ ] 不要な再レンダリング

---

## 緊急時のロールバック手順

```bash
# バックアップから復元
cp dragon-quest-rpg/index_6c69ad3.html dragon-quest-rpg/index.html

# または、gitで特定コミットに戻す
git checkout <commit-hash> -- dragon-quest-rpg/
```

---

## レビュー完了の定義

以下の**全て**が満たされた場合のみ「完璧」と言える：

1. ✅ **全機能チェックリストが完了**
2. ✅ **実機で全エリア動作確認済み**
3. ✅ **分割前との差分が説明可能**
4. ✅ **コンソールエラーが0件**
5. ✅ **ユーザーによる動作確認完了**

「完璧なコードレビュー」= 静的分析 + **実際の動作確認** + **ユーザー検証**
