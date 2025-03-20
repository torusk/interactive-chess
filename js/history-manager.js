// history-manager.js - 履歴管理を担当するモジュール

class HistoryManager {
  constructor() {
    this.positionHistory = []; // 各局面のFENと関連情報を保存
    this.completeHistory = []; // 完全な指し手履歴を保存
    this.currentPosition = 0; // 現在表示している局面のインデックス
    this.gameComments = {}; // 指し手のコメントを保存

    // 分岐管理用の新しいプロパティ
    this.mainLine = []; // アップロードした元の棋譜（メインライン）
    this.isOnMainLine = true; // 現在メインライン上にいるか
    this.variations = {}; // 分岐手順を格納するオブジェクト
    this.currentVariation = null; // 現在表示中の分岐ID
    this.variationPositions = {}; // 各分岐ポイントの位置情報
  }

  // 初期化
  initialize(fen) {
    this.positionHistory = [
      {
        fen: fen,
        pgn: "",
      },
    ];
    this.completeHistory = [];
    this.currentPosition = 0;
    this.gameComments = {};

    // 分岐関連の初期化
    this.mainLine = [];
    this.isOnMainLine = true;
    this.variations = {};
    this.currentVariation = null;
    this.variationPositions = {};
  }

  // 新しい手が指された時に呼び出す
  addMove(move, game) {
    // 現在メインライン上にいる場合
    if (this.isOnMainLine) {
      // メインラインの途中で新しい手が指された場合（分岐の可能性）
      if (
        this.mainLine.length > 0 &&
        this.currentPosition < this.mainLine.length - 1
      ) {
        // 次の手がメインラインと一致するか確認
        const nextMainMove = this.mainLine[this.currentPosition + 1];
        if (
          nextMainMove &&
          typeof nextMainMove.san !== "undefined" &&
          move.san !== nextMainMove.san
        ) {
          // メインラインと異なる手 → 分岐を作成
          return this.createVariation(move, game);
        } else {
          // メインラインと同じ手 → 単に次の手に進む
          this.currentPosition++;
          return this.currentPosition;
        }
      }

      // メインラインの最後に新しい手を追加
      if (this.currentPosition < this.positionHistory.length - 1) {
        // 途中で新しい手が指された場合、その先の履歴を消去
        this.positionHistory = this.positionHistory.slice(
          0,
          this.currentPosition + 1
        );
      }

      // 現在の局面を保存
      this.positionHistory.push({
        fen: game.fen(),
        pgn: game.pgn(),
        lastMove: move,
      });

      // メインラインにも反映
      if (this.mainLine.length > 0) {
        if (this.currentPosition >= this.mainLine.length - 1) {
          this.mainLine.push({
            fen: game.fen(),
            pgn: game.pgn(),
            san: move.san,
          });
        } else {
          // 既存の手を上書き
          this.mainLine[this.currentPosition + 1] = {
            fen: game.fen(),
            pgn: game.pgn(),
            san: move.san,
          };
        }
      }

      // 完全な履歴を更新
      this.completeHistory = game.history({ verbose: true });

      // 現在位置を更新
      this.currentPosition = this.positionHistory.length - 1;

      return this.currentPosition;
    } else {
      // 分岐上で新しい手が指された場合
      if (this.currentVariation) {
        const variation = this.variations[this.currentVariation];

        // 分岐の最後に新しい手を追加
        if (this.currentPosition < variation.positions.length - 1) {
          // 途中で新しい手が指された場合、その先の履歴を消去
          variation.positions = variation.positions.slice(
            0,
            this.currentPosition + 1
          );
        }

        // 現在の局面を保存
        variation.positions.push({
          fen: game.fen(),
          pgn: game.pgn(),
          lastMove: move,
        });

        // 現在位置を更新
        this.currentPosition = variation.positions.length - 1;

        return this.currentPosition;
      }
    }

    return null;
  }

  // 分岐を作成する
  createVariation(move, game) {
    const variationId = `var_${Date.now()}`;

    // 分岐点の位置を記録
    this.variationPositions[variationId] = this.currentPosition;

    // 新しい分岐を作成
    this.variations[variationId] = {
      basePosition: this.currentPosition, // どの局面から分岐したか
      positions: [
        // 最初は現在の局面
        {
          fen: this.positionHistory[this.currentPosition].fen,
          pgn: this.positionHistory[this.currentPosition].pgn,
        },
        // 分岐最初の手
        {
          fen: game.fen(),
          pgn: game.pgn(),
          lastMove: move,
        },
      ],
    };

    // 分岐モードに切り替え
    this.isOnMainLine = false;
    this.currentVariation = variationId;
    this.currentPosition = 1; // 分岐の最初の手に設定

    return this.currentPosition;
  }

  // メインラインに戻る
  returnToMainLine(position = null) {
    if (!this.isOnMainLine && this.currentVariation) {
      // 分岐の基点位置を取得
      const basePosition = this.variations[this.currentVariation].basePosition;

      // 指定された位置またはベース位置にセット
      this.currentPosition = position !== null ? position : basePosition;
      this.isOnMainLine = true;
      this.currentVariation = null;

      return this.positionHistory[this.currentPosition];
    }
    return null;
  }

  // 特定の分岐に移動
  goToVariation(variationId, position = 0) {
    if (this.variations[variationId]) {
      this.isOnMainLine = false;
      this.currentVariation = variationId;
      this.currentPosition = position;

      // 分岐の指定位置のデータを返す
      return this.variations[variationId].positions[position];
    }
    return null;
  }

  // 特定の局面に移動
  goToPosition(position) {
    if (this.isOnMainLine) {
      if (position >= 0 && position < this.positionHistory.length) {
        this.currentPosition = position;
        return this.positionHistory[this.currentPosition];
      }
    } else if (this.currentVariation) {
      const variation = this.variations[this.currentVariation];
      if (position >= 0 && position < variation.positions.length) {
        this.currentPosition = position;
        return variation.positions[this.currentPosition];
      }
    }
    return null;
  }

  // 一手前に戻る
  goToPreviousMove() {
    if (this.isOnMainLine) {
      if (this.currentPosition > 0) {
        this.currentPosition--;
        return this.positionHistory[this.currentPosition];
      }
    } else if (this.currentVariation) {
      const variation = this.variations[this.currentVariation];
      if (this.currentPosition > 0) {
        this.currentPosition--;
        return variation.positions[this.currentPosition];
      } else {
        // 分岐の最初の手より前に戻る場合はメインラインに戻る
        this.returnToMainLine();
        return this.positionHistory[this.currentPosition];
      }
    }
    return null;
  }

  // 一手先に進む
  goToNextMove() {
    if (this.isOnMainLine) {
      if (this.currentPosition < this.positionHistory.length - 1) {
        this.currentPosition++;
        return this.positionHistory[this.currentPosition];
      }
    } else if (this.currentVariation) {
      const variation = this.variations[this.currentVariation];
      if (this.currentPosition < variation.positions.length - 1) {
        this.currentPosition++;
        return variation.positions[this.currentPosition];
      }
    }
    return null;
  }

  // 最初の局面に移動
  goToFirstPosition() {
    if (this.isOnMainLine) {
      if (this.positionHistory.length > 0) {
        this.currentPosition = 0;
        return this.positionHistory[this.currentPosition];
      }
    } else if (this.currentVariation) {
      // 分岐の場合、メインラインに戻ってから最初に移動
      this.returnToMainLine(0);
      return this.positionHistory[0];
    }
    return null;
  }

  // 最後の局面に移動
  goToLastPosition() {
    if (this.isOnMainLine) {
      if (this.positionHistory.length > 0) {
        this.currentPosition = this.positionHistory.length - 1;
        return this.positionHistory[this.currentPosition];
      }
    } else if (this.currentVariation) {
      const variation = this.variations[this.currentVariation];
      if (variation.positions.length > 0) {
        this.currentPosition = variation.positions.length - 1;
        return variation.positions[this.currentPosition];
      }
    }
    return null;
  }

  // 履歴の生成
  generateHistoryHTML() {
    let html = "";

    if (this.isOnMainLine) {
      // メインラインの履歴を表示
      html = this.generateMainLineHTML();
    } else if (this.currentVariation) {
      // メインラインと分岐の両方を表示
      html = this.generateMainLineHTMLWithVariation();
    }

    return html;
  }

  // メインラインの履歴を生成
  generateMainLineHTML() {
    // チェスの完全な履歴を取得
    const history = this.completeHistory;
    let html = "";
    let moveNumber = 1;
    let lastMoveWasWhite = true;

    for (let i = 0; i < history.length; i++) {
      const move = history[i];

      // 手番号を表示するかどうか
      if (i % 2 === 0) {
        html += `<span class="move-number">${Math.floor(i / 2) + 1}.</span>`;
        lastMoveWasWhite = true;
      } else {
        lastMoveWasWhite = false;
      }

      // 分岐ポイントがあるかチェック
      let hasVariation = false;
      let variationId = null;

      // その局面から分岐があるかをチェック
      for (const varId in this.variationPositions) {
        if (this.variationPositions[varId] === i) {
          hasVariation = true;
          variationId = varId;
          break;
        }
      }

      // 指し手を表示（future-moveクラスを現在の局面より先の手に追加）
      const isFutureMove = i >= this.currentPosition;
      let moveClass = isFutureMove
        ? "history-move future-move"
        : "history-move";
      const isActiveMove = i === this.currentPosition - 1;
      const activeClass = isActiveMove ? " active" : "";
      const variationClass = hasVariation ? " has-variation" : "";

      html += `<span class="${moveClass}${activeClass}${variationClass}" data-move-index="${i}" data-variation="${
        hasVariation ? variationId : ""
      }">${move.san}${hasVariation ? "*" : ""}</span>`;

      // コメントがあれば表示
      const moveKey = lastMoveWasWhite
        ? `${moveNumber}.${move.san}`
        : `${moveNumber}...${move.san}`;

      if (this.gameComments[moveKey]) {
        html += `<span class="comment-text">${this.gameComments[moveKey]}</span>`;
      }

      // 黒の手の後に移動
      if (!lastMoveWasWhite) {
        moveNumber++;
      }
    }

    return html;
  }

  // 分岐を含むメインラインの履歴を生成
  generateMainLineHTMLWithVariation() {
    // メインラインの一部と分岐を表示
    const mainHistory = this.completeHistory;
    const variation = this.variations[this.currentVariation];
    let html = "";
    let moveNumber = 1;
    let lastMoveWasWhite = true;

    // 分岐点までのメインラインを表示
    const basePosition = variation.basePosition;

    for (let i = 0; i <= basePosition; i++) {
      const move = mainHistory[i];

      // 手番号を表示するかどうか
      if (i % 2 === 0) {
        html += `<span class="move-number">${Math.floor(i / 2) + 1}.</span>`;
        lastMoveWasWhite = true;
      } else {
        lastMoveWasWhite = false;
      }

      // 指し手を表示
      const isFutureMove = false; // 分岐点より前なので将来の手ではない
      const isActiveMove = i === this.currentPosition && this.isOnMainLine;
      const activeClass = isActiveMove ? " active" : "";
      const variationClass = i === basePosition ? " has-variation" : "";

      html += `<span class="history-move${activeClass}${variationClass}" data-move-index="${i}" data-main-line="true">${
        move.san
      }${i === basePosition ? "*" : ""}</span>`;

      // コメントがあれば表示
      const moveKey = lastMoveWasWhite
        ? `${moveNumber}.${move.san}`
        : `${moveNumber}...${move.san}`;

      if (this.gameComments[moveKey]) {
        html += `<span class="comment-text">${this.gameComments[moveKey]}</span>`;
      }

      // 黒の手の後に移動
      if (!lastMoveWasWhite) {
        moveNumber++;
      }
    }

    // 分岐ポイントの表示
    html += `<div class="variation-container">
      <div class="variation-label">分岐:</div>
      <div class="variation-moves">`;

    // 分岐の手を表示
    for (let i = 1; i < variation.positions.length; i++) {
      const move = variation.positions[i].lastMove;

      if (!move) continue;

      // 分岐内での手番計算（分岐点の手番を考慮）
      const isWhiteMove =
        (basePosition % 2 === 0 && i % 2 === 1) ||
        (basePosition % 2 === 1 && i % 2 === 0);

      // 手番号を表示
      if (isWhiteMove) {
        const num = Math.floor(basePosition / 2) + Math.ceil(i / 2);
        html += `<span class="move-number">${num}.</span>`;
      }

      // 指し手を表示
      const isActiveMove = i === this.currentPosition && !this.isOnMainLine;
      const activeClass = isActiveMove ? " active" : "";
      const isFutureMove = i > this.currentPosition;
      const futureClass = isFutureMove ? " future-move" : "";

      html += `<span class="history-move variation-move${activeClass}${futureClass}" data-move-index="${i}" data-variation="${this.currentVariation}">${move.san}</span>`;
    }

    html += `</div>
      <button class="return-to-main" data-position="${basePosition}">メインラインに戻る</button>
    </div>`;

    return html;
  }

  // PGN読み込み時に履歴を再構築
  rebuildFromPGN(game, comments) {
    // 初期化
    this.initialize(game.fen());
    this.gameComments = comments || {};

    // すべての手を再生
    const moves = game.history({ verbose: true });
    this.completeHistory = moves;

    if (moves.length > 0) {
      // 各手の局面を保存
      const tempGame = new Chess();

      // 初期局面
      this.positionHistory = [
        {
          fen: tempGame.fen(),
          pgn: tempGame.pgn(),
        },
      ];

      // メインラインを保存
      this.mainLine = [
        {
          fen: tempGame.fen(),
          pgn: tempGame.pgn(),
        },
      ];

      // 各手の局面を追加
      for (let i = 0; i < moves.length; i++) {
        const move = tempGame.move(moves[i]);
        this.positionHistory.push({
          fen: tempGame.fen(),
          pgn: tempGame.pgn(),
          lastMove: move,
        });

        // メインラインにも追加
        this.mainLine.push({
          fen: tempGame.fen(),
          pgn: tempGame.pgn(),
          san: move.san,
        });
      }

      // 現在位置を最新に設定
      this.currentPosition = this.positionHistory.length - 1;
      this.isOnMainLine = true;
    }
  }

  // ナビゲーションボタンの有効/無効状態を返す
  getNavigationState() {
    let canGoBack, canGoForward;

    if (this.isOnMainLine) {
      canGoBack = this.currentPosition > 0;
      canGoForward = this.currentPosition < this.positionHistory.length - 1;
    } else if (this.currentVariation) {
      const variation = this.variations[this.currentVariation];
      canGoBack = this.currentPosition > 0;
      canGoForward = this.currentPosition < variation.positions.length - 1;
    } else {
      canGoBack = false;
      canGoForward = false;
    }

    return {
      canGoBack: canGoBack,
      canGoForward: canGoForward,
      isAtStart: this.currentPosition === 0 && this.isOnMainLine,
      isAtEnd:
        (this.isOnMainLine &&
          this.currentPosition === this.positionHistory.length - 1) ||
        (!this.isOnMainLine &&
          this.currentVariation &&
          this.currentPosition ===
            this.variations[this.currentVariation].positions.length - 1),
      isOnMainLine: this.isOnMainLine,
      hasVariation: this.currentVariation !== null,
    };
  }
}

// グローバルなHistoryManagerインスタンスを作成
const historyManager = new HistoryManager();
