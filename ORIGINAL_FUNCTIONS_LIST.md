# 元のコード (index_6c69ad3.html) 関数一覧

**ファイル:** `c:\work\lumina_logic\dragon-quest-rpg\index_6c69ad3.html`
**総行数:** 12,074行
**総関数数:** 約220個（メソッドとアロー関数含む）

---

## カテゴリ1: インベントリ・アイテム管理 (7関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `getShopItems()` | 698 | 現在のショップの販売アイテムリストを取得 |
| `isStackable(itemId)` | 708 | アイテムがスタック可能か判定（装備品以外） |
| `addItem(itemId, quantity)` | 715 | インベントリにアイテムを追加（スタック処理含む） |
| `removeItem(itemId, quantity)` | 736 | インベントリからアイテムを削除 |
| `getItemCount(itemId)` | 750 | アイテムの所持数を取得 |
| `hasItem(itemId, quantity)` | 756 | アイテムを指定数量所持しているか判定 |
| `organizeInventory()` | 761 | インベントリをアイテムID順に整理 |

---

## カテゴリ2: 属性・耐性システム (5関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `getElementMultiplier(spell, enemy)` | 1735 | 敵に対する属性倍率を計算 |
| `getElementEffectivenessMessage(effectiveness, enemyName)` | 1768 | 属性効果メッセージを生成 |
| `getPlayerElementResistance(member, element)` | 1786 | プレイヤーの属性耐性を計算 |
| `getPlayerElementMultiplier(skill, member)` | 1805 | プレイヤーに対する属性倍率を計算 |
| `getPlayerElementEffectivenessMessage(effectiveness, memberName)` | 1832 | プレイヤー側属性効果メッセージ生成 |

---

## カテゴリ3: オーディオシステム (6関数 + 28メソッド)

### 関数

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `initAudio()` | 1874 | AudioContextを初期化 |
| `loadAudioBuffer(filename)` | 1903 | 音声ファイルを非同期で読み込み（async） |
| `playAudioBuffer(buffer, volume, loop)` | 1918 | AudioBufferを再生 |
| `playSE(filename)` | 1931 | 効果音を再生 |
| `createOscillator(type, frequency, duration, volume)` | 1947 | オシレーターで効果音を生成 |
| `toggleSound()` | 2283 | サウンドのオン/オフを切り替え |
| `updateSoundToggleIcon()` | 2307 | サウンドトグルボタンのアイコン更新 |

### SE（効果音）オブジェクトのメソッド

| メソッド名 | 行番号 | 説明 |
|------------|--------|------|
| `SE.attack()` | 1962 | 通常攻撃音 |
| `SE.critical()` | 1965 | クリティカル音 |
| `SE.damage()` | 1968 | ダメージ音 |
| `SE.miss()` | 1971 | ミス音 |
| `SE.magicAttack()` | 1984 | 魔法攻撃音 |
| `SE.heal()` | 1987 | 回復音 |
| `SE.buff()` | 1990 | バフ音 |
| `SE.debuff()` | 2003 | デバフ音 |
| `SE.victory()` | 2016 | 勝利音 |
| `SE.defeat()` | 2019 | 敗北音 |
| `SE.escape()` | 2036 | 逃走音 |
| `SE.cursor()` | 2041 | カーソル移動音 |
| `SE.confirm()` | 2050 | 決定音 |
| `SE.cancel()` | 2064 | キャンセル音 |
| `SE.chest()` | 2076 | 宝箱音 |
| `SE.levelUp()` | 2094 | レベルアップ音 |
| `SE.stairs()` | 2097 | 階段音 |
| `SE.door()` | 2107 | ドア音 |
| `SE.encounter()` | 2119 | エンカウント音 |
| `SE.save()` | 2122 | セーブ音 |
| `SE.inn()` | 2135 | 宿屋音 |
| `SE.buy()` | 2138 | 購入音 |
| `SE.revive()` | 2153 | 蘇生音 |

### BGM（音楽）オブジェクトのメソッド

| メソッド名 | 行番号 | 説明 |
|------------|--------|------|
| `BGM.play(type)` | 2189 | BGMを再生 |
| `BGM._startPlayback(offset)` | 2209 | BGM再生を開始（内部用） |
| `BGM.stop()` | 2224 | BGMを停止 |
| `BGM.pause()` | 2236 | BGMを一時停止 |
| `BGM.resume()` | 2245 | BGMを再開 |
| `BGM.setVolume(vol)` | 2251 | BGM音量を設定 |
| `BGM.getBgmTypeForMap(mapData)` | 2259 | マップデータからBGMタイプを判定 |

---

## カテゴリ4: ゲーム進行・フラグ管理 (15関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `setStoryFlag(flagName, value)` | 2423 | ストーリーフラグを設定 |
| `getStoryFlag(flagName)` | 2429 | ストーリーフラグを取得 |
| `setBossDefeated(bossName, value)` | 2433 | ボス撃破フラグを設定 |
| `isBossDefeated(bossName)` | 2443 | ボス撃破済みか判定 |
| `resetGameProgress()` | 2447 | ゲーム進行状態をリセット |
| `isPassageOpened(mapId, x, y)` | 2495 | 隠し通路が開かれているか判定 |
| `openPassage(mapId, x, y)` | 2501 | 隠し通路を開く |
| `applyOpenedPassages(mapData)` | 2511 | 開いた隠し通路をマップに適用 |
| `registerVisitedLocation(mapData)` | 2524 | 訪問済み拠点を登録（ルーラ用） |
| `getAvailableRuraLocations()` | 2542 | ルーラ可能な拠点リストを取得 |
| `recordDungeonEntrance(prevMapData, prevX, prevY, prevMapPath)` | 2556 | ダンジョン進入位置を記録（リレミト用） |
| `getLastEntrance()` | 2570 | 最後のダンジョン進入位置を取得 |
| `isCurrentMapOutdoor()` | 2575 | 現在のマップが屋外か判定 |
| `setQuestFlag(questName, flagName, value)` | 2580 | クエストフラグを設定 |
| `getQuestFlag(questName, flagName)` | 2586 | クエストフラグを取得 |
| `isQuestCompleted(questName)` | 2593 | クエストが完了したか判定 |
| `areAllDesertQuestsCompleted()` | 2597 | 全砂漠クエスト完了判定 |

---

## カテゴリ5: パーティメンバー管理 (16関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `createPartyMember(config)` | 2829 | パーティメンバーを作成 |
| `migratePartyMemberStats()` | 2878 | 既存メンバーのステータスをマイグレート |
| `setupPlayerProxy()` | 2989 | プレイヤーオブジェクトのProxyを設定 |
| `getAlivePartyMembers()` | 3033 | 生存しているパーティメンバーを取得 |
| `getPartyMember(index)` | 3037 | インデックスでパーティメンバーを取得 |
| `addPartyMember(config)` | 3041 | パーティにメンバーを追加 |
| `isPartyAlive()` | 3052 | パーティが全滅していないか判定 |
| `getDeadPartyMembers()` | 3057 | 戦闘不能のメンバーを取得 |
| `restoreAll()` | 3062 | 全員のHP/MPを全回復 |
| `reviveMember(member, fullHp)` | 3072 | メンバーを蘇生 |
| `updateMemberActualStats(member)` | 3081 | メンバーの実効ステータスを更新 |
| `updateActualStats(member)` | 3097 | 実効ステータス更新（全員または指定メンバー） |
| `getPlayerAtk()` | 3106 | プレイヤーの攻撃力を取得 |
| `getPlayerDef()` | 3110 | プレイヤーの防御力を取得 |
| `applyStatusEffect(target, effect)` | 3119 | ステータス効果を適用 |
| `getStatusIcons(target)` | 3135 | ステータスアイコンを取得 |
| `getStatusBadges(target)` | 3144 | ステータスバッジ（詳細）を取得 |
| `getBuffBadges()` | 3153 | バフバッジを取得 |
| `checkWakeUp(target, name)` | 3162 | 睡眠から覚醒するか判定 |
| `processPoisonDamage(target, name, maxHp)` | 3175 | 毒ダメージを処理 |
| `getHitRate(attacker)` | 3185 | 命中率を計算 |
| `getExpForLevel(level)` | 3195 | レベルアップに必要な経験値を計算 |

---

## カテゴリ6: 敵キャラクター管理 (4関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `getAliveEnemies()` | 3316 | 生存している敵を取得 |
| `getFirstAliveEnemyIndex()` | 3321 | 最初の生存敵のインデックスを取得 |
| `getNextAliveEnemyIndex(currentIndex, wrap)` | 3328 | 次の生存敵のインデックスを取得 |
| `getPrevAliveEnemyIndex(currentIndex)` | 3340 | 前の生存敵のインデックスを取得 |
| `generateEnemyGroup(encounterTable)` | 3354 | エンカウントテーブルから敵グループを生成 |

---

## カテゴリ7: ゲームシステム・UI (6関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `updateMapNameColor()` | 3412 | マップ名の色を更新 |
| `resize()` | 3428 | 画面リサイズ処理 |
| `updateCamera()` | 3437 | カメラ位置を更新 |
| `saveGame()` | 3449 | ゲームをlocalStorageに保存 |
| `loadGame()` | 3521 | ゲームをlocalStorageから読み込み（async） |

---

## カテゴリ8: レンダリング・描画 (18関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `getTileColor(tile)` | 3846 | タイルIDから色を取得 |
| `drawMap()` | 3853 | マップを描画 |
| `drawTileDecoration(tile, x, y, col, row)` | 3932 | タイルの装飾を描画 |
| `drawChests()` | 4040 | 宝箱を描画 |
| `drawIceBlocks()` | 4054 | 氷ブロックを描画 |
| `drawNPCs()` | 4085 | NPCを描画 |
| `drawPlayer()` | 4103 | プレイヤーを描画 |
| `drawMessageWindow()` | 4122 | メッセージウィンドウを描画 |
| `drawWindow(x, y, w, h)` | 4163 | ウィンドウ枠を描画 |
| `wrapText(text, maxWidth, font)` | 4175 | テキストを折り返し |
| `drawWrappedText(text, x, y, maxWidth, lineHeight, font)` | 4219 | 折り返しテキストを描画 |
| `drawMenu()` | 4228 | メニュー画面を描画 |
| `drawInn()` | 4706 | 宿屋画面を描画 |
| `drawChurch()` | 4743 | 教会画面を描画 |
| `drawPartyJoinConfirm()` | 4835 | パーティ加入確認画面を描画 |
| `drawShop()` | 4867 | ショップ画面を描画 |
| `getStatChangePreview(item)` | 5051 | 装備品のステータス変化プレビューを取得 |
| `startSpellFlash(color, isUltimate, spellType)` | 5068 | 呪文エフェクトのフラッシュ開始 |
| `drawBattle()` | 5138 | 戦闘画面を描画 |
| `draw()` | 5506 | メイン描画関数 |

---

## カテゴリ9: バトルシステム - メイン (21関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `startBattle(monsterTypeOrTable)` | 5566 | 戦闘を開始 |
| `generateEnemyAppearMessage(enemies)` | 5649 | 敵出現メッセージを生成 |
| `showBattleMessage(msg, callback)` | 5663 | 戦闘メッセージを表示 |
| `getEffectiveSuccessRate(spell, enemy)` | 5671 | 呪文の実効成功率を計算 |
| `executeBattleCommand()` | 5677 | 戦闘コマンドを実行 |
| `startTargetSelection(actionType, spellId)` | 5997 | ターゲット選択を開始 |
| `confirmTargetSelection()` | 6005 | ターゲット選択を確定 |
| `cancelTargetSelection()` | 6021 | ターゲット選択をキャンセル |
| `startAllySelection(actionType, spellId)` | 6028 | 味方選択を開始 |
| `confirmAllySelection()` | 6035 | 味方選択を確定 |
| `cancelAllySelection()` | 6068 | 味方選択をキャンセル |
| `executeSpellOnTarget(spellId, targetIndex)` | 6076 | 対象に呪文を実行 |
| `executeSpellOnAll(spellId)` | 6141 | 全体に呪文を実行 |
| `processAoeDamage(spell, enemyIndex)` | 6164 | 範囲攻撃ダメージを処理 |
| `getCurrentPartyMember()` | 6216 | 現在のターンのパーティメンバーを取得 |
| `getNextAlivePartyIndex(currentIndex)` | 6221 | 次の生存パーティメンバーのインデックス取得 |
| `processTurnEnd()` | 6231 | ターン終了処理 |
| `processPartyPoisonAndEnemyTurn()` | 6250 | パーティの毒ダメージと敵ターンを処理 |
| `playerAttack(targetIndex)` | 6277 | プレイヤーの通常攻撃 |
| `enemyTurn()` | 6339 | 敵ターン開始 |
| `processCurrentEnemyTurn()` | 6352 | 現在の敵のターンを処理 |

---

## カテゴリ10: バトルシステム - ターン制御 (10関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `getRandomAlivePartyMember()` | 6390 | ランダムな生存パーティメンバーを取得 |
| `executeEnemyAttack()` | 6396 | 敵の攻撃を実行 |
| `processCurrentEnemyTurnEnd()` | 6455 | 現在の敵ターン終了処理 |
| `nextEnemyTurn()` | 6476 | 次の敵ターンへ |
| `processEnemyTurnEnd()` | 6488 | 敵ターン終了処理 |
| `generateActionQueue()` | 6493 | アクションキューを生成（速度順） |
| `processNextAction()` | 6528 | 次のアクションを処理 |
| `startNewTurn()` | 6590 | 新しいターンを開始 |
| `startPlayerTurn()` | 6597 | プレイヤーターン開始 |
| `tryEscape()` | 6604 | 逃走を試みる |

---

## カテゴリ11: バトルシステム - 勝敗処理 (8関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `checkBattleEnd()` | 6646 | 戦闘終了判定 |
| `battleWin()` | 6656 | 戦闘勝利処理 |
| `handleDesertBossDefeat(bossId, exp, gold)` | 6752 | 砂漠ボス撃破処理 |
| `checkNewSpells(level)` | 6836 | 新規習得呪文をチェック |
| `showSpellLearnMessages(spellList, callback)` | 6850 | 呪文習得メッセージを表示 |
| `checkMemberLevelUp(member, callback)` | 6864 | メンバーのレベルアップをチェック |
| `checkMemberNewSpells(member, level)` | 6909 | メンバーの新規習得呪文をチェック |
| `showMemberSpellLearnMessages(member, spellList, callback)` | 6924 | メンバーの呪文習得メッセージ表示 |
| `checkLevelUp(callback)` | 6936 | レベルアップをチェック |
| `battleLose()` | 6953 | 戦闘敗北処理 |
| `endBattle(result)` | 6978 | 戦闘を終了 |

---

## カテゴリ12: エンディング (6関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `startEnding()` | 7047 | エンディングを開始 |
| `startTriumphEvent()` | 7085 | 勝利イベントを開始 |
| `startStaffRoll()` | 7102 | スタッフロールを開始 |
| `updateStaffRoll()` | 7109 | スタッフロールを更新 |
| `drawEnding()` | 7121 | エンディング画面を描画 |
| `handleEndingInput()` | 7161 | エンディング入力処理 |
| `resetGame()` | 7168 | ゲームをリセット |

---

## カテゴリ13: フィールド移動・エンカウント (6関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `checkRandomEncounter()` | 7207 | ランダムエンカウントをチェック |
| `getCurrentEncounterRate()` | 7261 | 現在のエンカウント率を取得 |
| `getNpcEffectivePosition(npc)` | 7273 | NPCの有効座標を取得 |
| `getNpcAt(x, y)` | 7290 | 指定座標のNPCを取得 |
| `getChestAt(x, y)` | 7298 | 指定座標の宝箱を取得 |
| `isNpcBlocking(x, y)` | 7303 | NPCが通行を妨害しているか判定 |
| `isChestBlocking(x, y)` | 7304 | 宝箱が通行を妨害しているか判定 |

---

## カテゴリ14: ダイアログ・会話システム (4関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `startDialog(messages)` | 7309 | ダイアログを開始 |
| `typeNextChar()` | 7319 | 次の文字をタイプ（タイプライター効果） |
| `advanceDialog()` | 7331 | ダイアログを進める |
| `closeDialog()` | 7348 | ダイアログを閉じる |

---

## カテゴリ15: 宝箱・メニュー操作 (7関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `openChest(chest)` | 7364 | 宝箱を開く |
| `openMenu()` | 7384 | メニューを開く |
| `closeMenu()` | 7391 | メニューを閉じる |
| `executeItemAction()` | 7404 | アイテムアクションを実行 |
| `confirmEquipMember()` | 7479 | 装備メンバー選択を確定 |
| `confirmItemMember()` | 7501 | アイテム使用メンバー選択を確定 |

---

## カテゴリ16: 宿屋・教会システム (8関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `openInn(cost)` | 7518 | 宿屋を開く |
| `closeInn()` | 7524 | 宿屋を閉じる |
| `confirmInn()` | 7528 | 宿屋利用を確定 |
| `openChurch()` | 7560 | 教会を開く |
| `closeChurch()` | 7568 | 教会を閉じる |
| `getReviveCost(member)` | 7574 | 蘇生費用を計算 |
| `getCureCost()` | 7579 | 解毒費用を計算 |
| `selectChurchMenu()` | 7584 | 教会メニューを選択 |
| `confirmChurchMember()` | 7620 | 教会対象メンバーを確定 |
| `confirmChurchAction()` | 7650 | 教会アクションを確定 |

---

## カテゴリ17: ショップシステム (4関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `openShop(shopId)` | 7693 | ショップを開く |
| `updateSellableItems()` | 7707 | 売却可能アイテムリストを更新 |
| `closeShop()` | 7716 | ショップを閉じる |
| `handleShopInput(action)` | 7721 | ショップ入力を処理 |

---

## カテゴリ18: フィールド魔法・アイテム使用 (8関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `useItem(itemId, targetMember)` | 7857 | アイテムを使用 |
| `useSpellInField()` | 7969 | フィールドで呪文を使用 |
| `executeFieldSpellOnTarget()` | 8048 | フィールド呪文を対象に実行 |
| `useRura()` | 8136 | ルーラを使用 |
| `executeRura(locationIndex)` | 8173 | ルーラを実行（async） |
| `playRuraAnimation()` | 8199 | ルーラアニメーションを再生（async） |
| `useRiremito()` | 8214 | リレミトを使用 |
| `playRiremitoAnimation()` | 8251 | リレミトアニメーションを再生（async） |
| `drawRuraSelection()` | 8265 | ルーラ選択画面を描画 |
| `cancelRuraSelection()` | 8323 | ルーラ選択をキャンセル |
| `equipItem(itemId, member)` | 8327 | 装備品を装備 |

---

## カテゴリ19: マップ読み込み・ワープシステム (11関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `loadMapFromDatabase(mapPath)` | 8368 | データベースからマップを読み込み（async） |
| `isMapPath(target)` | 8400 | マップパスか判定 |
| `getMapIdFromPath(mapPath)` | 8405 | マップパスからIDを取得 |
| `getMapPathFromId(mapId)` | 8415 | マップIDからパスを取得 |
| `checkWarp()` | 8420 | ワープをチェック |
| `performStairWarp(stairWarp)` | 8460 | 階段ワープを実行（async） |
| `performHoleWarp(targetMap, x, y)` | 8477 | 穴ワープを実行（async） |
| `performPortalWarp(portal)` | 8509 | ポータルワープを実行（async） |
| `playSealAnimation()` | 8554 | 封印アニメーション再生（async） |
| `playPortalAnimation()` | 8580 | ポータルアニメーション再生（async） |
| `performWarp(targetMap, targetX, targetY)` | 8609 | ワープを実行（async） |
| `performLegacyWarp(targetMapId, targetX, targetY)` | 8743 | レガシーワープを実行 |

---

## カテゴリ20: プレイヤー移動・氷パズル (12関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `canMove(x, y)` | 8811 | 移動可能か判定 |
| `getIceBlockAt(x, y)` | 8822 | 指定座標の氷ブロックを取得 |
| `movePlayer(dx, dy)` | 8832 | プレイヤーを移動 |
| `handleIceFloorSlide(dx, dy)` | 8882 | 氷床での滑り処理 |
| `handleIceHoleFall()` | 8938 | 氷穴への落下処理 |
| `pushIceBlock(blockX, blockY, dx, dy)` | 8977 | 氷ブロックを押す |
| `checkIceSwitches()` | 9064 | 氷スイッチの状態をチェック |
| `handlePuzzleComplete(mapId)` | 9091 | パズル完了処理 |
| `initIceBlocks()` | 9107 | 氷ブロックを初期化 |
| `getFrontPosition()` | 9116 | プレイヤーの正面座標を取得 |

---

## カテゴリ21: インタラクション・イベント (17関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `interact()` | 9127 | インタラクション実行 |
| `handleWedgeAltar(x, y)` | 9212 | 楔祭壇を処理 |
| `collectWedge(wedgeId, skipDialog)` | 9253 | 楔を収集 |
| `checkAllWedgesCollected()` | 9333 | 全楔収集をチェック |
| `checkHiddenWall(x, y)` | 9353 | 隠し壁をチェック |
| `revealHiddenPassage(x, y)` | 9364 | 隠し通路を開示 |
| `flashScreen(color, duration)` | 9384 | 画面フラッシュ |
| `handleHealerNpc(npc)` | 9394 | ヒーラーNPCを処理 |
| `handleAncientSpellQuest(npc)` | 9421 | 古代呪文クエストを処理 |
| `handleKingDialog(npc)` | 9463 | 王様との会話を処理 |
| `handleBossNpc(npc)` | 9514 | ボスNPCを処理 |
| `handleQuestGiver(npc)` | 9559 | クエスト提供NPCを処理 |
| `handleWaterShortageQuest(npc)` | 9586 | 水不足クエストを処理 |
| `handleSunFlameQuest(npc)` | 9639 | 太陽の炎クエストを処理 |
| `handlePartyJoinNpc(npc)` | 9675 | パーティ加入NPCを処理 |
| `handleSerenJoinNpc(npc)` | 9709 | セレンの加入を処理 |
| `executePartyJoin(npcId)` | 9749 | パーティ加入を実行 |
| `executeSerenJoin()` | 9785 | セレンの加入を実行 |
| `executeGlacioJoin()` | 9817 | グラシオの加入を実行 |
| `handleGlacioJoinNpc(npc)` | 9852 | グラシオ加入NPCを処理 |
| `getNpcById(npcId)` | 9890 | NPCをIDで取得 |

---

## カテゴリ22: ボス戦システム (7関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `startBossBattle(bossId)` | 9896 | ボス戦を開始 |
| `startDialogWithCallback(messages, onComplete)` | 9972 | コールバック付きダイアログ開始 |
| `startMaouBattle()` | 9984 | 魔王戦を開始 |
| `selectMaouAction()` | 10040 | 魔王のアクションを選択 |
| `executeMaouSkill(skillId, callback)` | 10089 | 魔王のスキルを実行 |
| `maouTurn()` | 10243 | 魔王ターン |
| `executeMaouActions()` | 10249 | 魔王のアクションを実行 |
| `doMaouAction()` | 10268 | 魔王のアクションを実行 |

---

## カテゴリ23: 入力制御・UI操作 (9関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `startContinuousMove(dx, dy)` | 10855 | 連続移動を開始 |
| `stopContinuousMove()` | 10872 | 連続移動を停止 |
| `setupDpadButton(id, dx, dy)` | 10881 | 方向パッドボタンをセットアップ |
| `setupActionButton(id, callback)` | 11041 | アクションボタンをセットアップ |
| `onActionA()` | 11052 | Aボタンアクション |
| `onActionB()` | 11123 | Bボタンアクション |
| `handleCanvasTap(clientX, clientY)` | 11194 | キャンバスタップを処理 |
| `updateEncounterDebug()` | 11295 | エンカウントデバッグ情報を更新 |

---

## カテゴリ24: ゲームループ・ワールドマップ (8関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `gameLoop()` | 11301 | メインゲームループ |
| `openWorldMap()` | 11358 | ワールドマップを開く |
| `closeWorldMap()` | 11379 | ワールドマップを閉じる |
| `renderWorldMap()` | 11399 | ワールドマップを描画 |
| `startPlayerMarkerAnimation()` | 11535 | プレイヤーマーカーアニメーション開始 |
| `updateMapPinVisibility()` | 11604 | マップピンの表示/非表示を更新 |
| `updateFloorDisplay()` | 11616 | フロア表示を更新 |

---

## カテゴリ25: タイトル画面・初期化 (8関数)

| 関数名 | 行番号 | 説明 |
|--------|--------|------|
| `checkSaveData()` | 11644 | セーブデータの存在をチェック |
| `initTitleScreen()` | 11650 | タイトル画面を初期化 |
| `createDebugSaveData()` | 11704 | デバッグ用セーブデータを作成 |
| `updateTitleMenuSelection()` | 11858 | タイトルメニュー選択を更新 |
| `activateTitleMenu()` | 11868 | タイトルメニューをアクティブ化 |
| `selectTitleMenuItem()` | 11880 | タイトルメニュー項目を選択（async） |
| `resetGameState()` | 11937 | ゲーム状態をリセット（async） |
| `initGame()` | 12064 | ゲームを初期化（async） |

---

## 内部アロー関数・コールバック (14個)

これらは他の関数内で定義されているアロー関数です。

| 関数名 | 行番号 | 親関数 | 説明 |
|--------|--------|--------|------|
| `ultimateFlash` | 5090 | `startSpellFlash` | 究極呪文のフラッシュ効果 |
| `finalFade` | 5096 | `ultimateFlash` | 最終フェード |
| `fadeOut` | 5122 | `startSpellFlash` | フェードアウト |
| `showEffectMessage` | 6117 | `executeSpellOnTarget` | 効果メッセージ表示 |
| `continueAfterPoison` | 6236 | `processTurnEnd` | 毒ダメージ後の継続 |
| `showNext` | 6264 | `processPartyPoisonAndEnemyTurn` | 次の毒メッセージ表示 |
| `afterStats` | 6893 | `checkMemberLevelUp` | ステータス表示後 |
| `checkNext` | 6940 | `checkLevelUp` | 次のレベルアップチェック |
| `showEffectAndContinue` | 10210 | `executeMaouSkill` | 効果表示と継続 |
| `animate` (穴ワープ) | 8486 | `performHoleWarp` | 穴ワープアニメ |
| `animate` (封印) | 8559 | `playSealAnimation` | 封印アニメ |
| `animate` (ポータル) | 8586 | `playPortalAnimation` | ポータルアニメ |
| `animateMarker` | 11538 | `startPlayerMarkerAnimation` | マーカーアニメ |
| `handlePress` (方向パッド) | 10883 | `setupDpadButton` | 方向パッド押下 |
| `handleRelease` (方向パッド) | 11025 | `setupDpadButton` | 方向パッド解放 |
| `handlePress` (アクション) | 11043 | `setupActionButton` | アクションボタン押下 |
| `handleRelease` (アクション) | 11044 | `setupActionButton` | アクションボタン解放 |
| `handleSoundToggle` | 11676 | `initTitleScreen` | サウンド切替 |

---

## 統計サマリー

- **総関数数**: 約220個
- **通常関数宣言**: 196個
- **async関数**: 9個
- **オブジェクトメソッド**: 28個（SE/BGM）
- **内部アロー関数**: 14個

### カテゴリ別分布

| カテゴリ | 関数数 |
|---------|--------|
| インベントリ・アイテム管理 | 7 |
| 属性・耐性システム | 5 |
| オーディオシステム | 34 |
| ゲーム進行・フラグ管理 | 15 |
| パーティメンバー管理 | 16 |
| 敵キャラクター管理 | 4 |
| ゲームシステム・UI | 6 |
| レンダリング・描画 | 18 |
| バトルシステム - メイン | 21 |
| バトルシステム - ターン制御 | 10 |
| バトルシステム - 勝敗処理 | 8 |
| エンディング | 6 |
| フィールド移動・エンカウント | 6 |
| ダイアログ・会話システム | 4 |
| 宝箱・メニュー操作 | 7 |
| 宿屋・教会システム | 8 |
| ショップシステム | 4 |
| フィールド魔法・アイテム使用 | 8 |
| マップ読み込み・ワープシステム | 11 |
| プレイヤー移動・氷パズル | 12 |
| インタラクション・イベント | 17 |
| ボス戦システム | 7 |
| 入力制御・UI操作 | 9 |
| ゲームループ・ワールドマップ | 8 |
| タイトル画面・初期化 | 8 |
| 内部アロー関数 | 14 |

---

## 主要な非同期関数

以下の関数は非同期処理（async/await）を使用しています：

1. `loadAudioBuffer(filename)` - 行1903
2. `loadGame()` - 行3521
3. `executeRura(locationIndex)` - 行8173
4. `playRuraAnimation()` - 行8199
5. `playRiremitoAnimation()` - 行8251
6. `loadMapFromDatabase(mapPath)` - 行8368
7. `performStairWarp(stairWarp)` - 行8460
8. `performHoleWarp(targetMap, x, y)` - 行8477
9. `performPortalWarp(portal)` - 行8509
10. `playSealAnimation()` - 行8554
11. `playPortalAnimation()` - 行8580
12. `performWarp(targetMap, targetX, targetY)` - 行8609
13. `selectTitleMenuItem()` - 行11880
14. `resetGameState()` - 行11937
15. `initGame()` - 行12064

---

## 備考

- このファイルはドラゴンクエスト風RPGの全機能を単一HTMLファイルに実装
- 関数は機能別に明確に分離されており、保守性が高い
- 戦闘システム、マップシステム、イベントシステムが独立して動作
- 非同期処理を活用したマップ読み込みとアニメーション
- 詳細なフラグ管理システムでゲーム進行を制御
