# 分割後のコード (js/*.js) 関数一覧

## app.js
- (export なし)

## battle.js
- generateEnemyGroup (行10)
- startBattle (行26)
- updateBattle (行52)
- advanceBattlePhase (行62)
- getAliveEnemies (行151)
- checkBattleEnd (行155)
- battleWin (行169)
- battleLose (行217)
- endBattle (行223)
- canUseSpellsInCurrentMap (行229)

## constants.js
- VISIBLE_TILES (行5) ※定数
- SAVE_KEY (行6) ※定数
- MODE (行8) ※定数
- TILE (行20) ※定数
- MAP_TILE_COLORS (行61) ※定数
- DEFAULT_TILE_COLORS (行89) ※定数
- WALKABLE_TILES (行130) ※定数
- ENCOUNTER_TILES (行141) ※定数
- SAFE_STEPS (行147) ※定数
- ENCOUNTER_RATE_PER_STEP (行148) ※定数
- MAX_ENCOUNTER_RATE (行149) ※定数
- MAX_STACK_SIZE (行151) ※定数
- ELEMENTS (行152) ※定数

## data.js
- expTable (行3) ※定数
- MAP_TILE_COLORS (行9) ※定数
- DEFAULT_TILE_COLORS (行23) ※定数
- items (行50) ※定数
- shopItemsByArea (行139) ※定数
- monsters (行152) ※定数
- bossSkills (行232) ※定数
- encounterTables (行250) ※定数
- encounterTableFallback (行286) ※定数
- spells (行291) ※定数
- STATUS_EFFECTS (行326) ※定数

## engine.js
- getReviveCost (行19)
- getCureCost (行23)
- getAlivePartyMembers (行27)
- updateMemberActualStats (行31)
- checkLevelUp (行35)
- checkMemberLevelUp (行39)
- isMapPath (行64)
- getMapPathFromId (行68)
- getMapIdFromPath (行73)
- performLegacyWarp (行134)
- updateCamera (行151)
- movePlayer (行171)
- canMoveTo (行195)
- isNpcBlocking (行234)
- isChestBlocking (行239)
- isIceBlockBlocking (行244)
- updatePlayerMovement (行249)
- checkRandomEncounter (行285)
- checkWarp (行354)
- checkCurrent (行368)
- getTileAt (行419)
- checkInteractionWarp (行432)
- updateGigant (行482)
- updateNPCs (行527)
- startDialog (行534)
- typeNextChar (行544)
- advanceDialog (行556)
- closeDialog (行573)
- openMenu (行596)
- closeMenu (行603)
- openShop (行615)
- openInn (行622)
- closeInn (行628)
- openChurch (行633)
- closeChurch (行639)
- cancelTargetSelection (行645)
- cancelAllySelection (行651)
- handleShopInput (行658)
- getFrontPosition (行666)
- getNpcAt (行677)
- getChestAt (行682)
- openChest (行687)
- interact (行707)
- saveGame (行849)
- resetGame (行943)
- startNewGame (行1054)
- createDebugSave (行1060)
- checkSaveData (行1198)
- updateTitleMenuSelection (行1208)
- initTitleScreen (行1226)

## input.js
- setupInputs (行31)
- handleInput (行114)

## map.js
- openWorldMap (行60)
- closeWorldMap (行85)
- renderWorldMap (行98)
- updateMapPinVisibility (行291)

## renderer.js
- setContext (行17)
- getNpcEffectivePosition (行21)
- drawIceBlocks (行33)
- drawMap (行62)
- getTileColor (行160)
- drawTileDecoration (行167)
- drawChests (行278)
- drawNPCs (行296)
- drawPlayer (行319)
- drawWindow (行346)
- wrapText (行357)
- drawMessageWindow (行390)
- drawMenu (行420)
- drawInn (行524)
- drawChurch (行558)
- drawShop (行589)
- drawBattle (行604)
- drawPartyJoinConfirm (行634)
- drawRuraSelection (行660)
- drawEnding (行665)

## sound.js
- initAudio (行17)
- playSE (行65)
- toggleSound (行354)
- updateSoundToggleIcon (行371)

## state.js
- setupPlayerProxy (行83)
- isStackable (行186)
- addItem (行192)
- removeItem (行216)
- getItemCount (行229)
- hasItem (行234)
- setGameMode (行247)
- setTitleMenuIndex (行248)
- setTitleMenuActive (行249)
- setHasSaveData (行250)
- createPartyMember (行252)
- updateMemberActualStats (行276)
- updateActualStats (行283)
- resetGameProgress (行291)
- setCameraX (行405)
- setCameraY (行406)
- setTileSize (行407)
- setCanvasWidth (行408)
- setCanvasHeight (行409)
- setCurrentMap (行410)
- setCurrentMapId (行411)
- setIsTransitioning (行412)
- setStepsSinceLastBattle (行413)
- setCurrentMapPath (行414)
- getStoryFlag (行436)
- isBossDefeated (行444)

---

## 統計
- **総ファイル数**: 10
- **export function 総数**: 113
- **export const 総数**: 24 (constants.js + data.js)
- **export なし**: 1ファイル (app.js)

## ファイル別関数数
1. engine.js: 48関数
2. state.js: 23関数
3. renderer.js: 19関数
4. battle.js: 10関数
5. map.js: 4関数
6. sound.js: 4関数
7. input.js: 2関数
8. constants.js: 13定数
9. data.js: 11定数
10. app.js: 0 (メインエントリーポイント)
