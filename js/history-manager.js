// history-manager.js - 履歴管理を担当するモジュール

class HistoryManager {
  constructor() {
    this.positionHistory = []; // 各局面のFENと関連情報を保存
    this.completeHistory = []; // 完全な指し手履歴を保存
    this.currentPosition = 0; // 現在表示している局面のインデックス
    this.gameComments = {}; // 指し手のコメントを保存
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
  }

  // 新しい手が指された時に呼び出す
  addMove(move, game) {
    // 新しい手が指されたら、その先の履歴を消去
    if (this.currentPosition < this.positionHistory.length - 1) {
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

    // 完全な履歴を更新
    this.completeHistory = game.history({ verbose: true });

    // 現在位置を更新
    this.currentPosition = this.positionHistory.length - 1;

    return this.currentPosition;
  }

  // 特定の局面に移動
  goToPosition(position) {
    if (position >= 0 && position < this.positionHistory.length) {
      this.currentPosition = position;
      return this.positionHistory[this.currentPosition];
    }
    return null;
  }

  // 一手前に戻る
  goToPreviousMove() {
    if (this.currentPosition > 0) {
      this.currentPosition--;
      return this.positionHistory[this.currentPosition];
    }
    return null;
  }

  // 一手先に進む
  goToNextMove() {
    if (this.currentPosition < this.positionHistory.length - 1) {
      this.currentPosition++;
      return this.positionHistory[this.currentPosition];
    }
    return null;
  }

  // 最初の局面に移動
  goToFirstPosition() {
    if (this.positionHistory.length > 0) {
      this.currentPosition = 0;
      return this.positionHistory[this.currentPosition];
    }
    return null;
  }

  // 最後の局面に移動
  goToLastPosition() {
    if (this.positionHistory.length > 0) {
      this.currentPosition = this.positionHistory.length - 1;
      return this.positionHistory[this.currentPosition];
    }
    return null;
  }

  // 履歴の生成
  generateHistoryHTML() {
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

      // 指し手を表示（future-moveクラスを現在の局面より先の手に追加）
      const isFutureMove = i >= this.currentPosition;
      const moveClass = isFutureMove
        ? "history-move future-move"
        : "history-move";
      const isActiveMove = i === this.currentPosition - 1;
      const activeClass = isActiveMove ? " active" : "";

      html += `<span class="${moveClass}${activeClass}" data-move-index="${i}">${move.san}</span>`;

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

      // 各手の局面を追加
      for (let i = 0; i < moves.length; i++) {
        tempGame.move(moves[i]);
        this.positionHistory.push({
          fen: tempGame.fen(),
          pgn: tempGame.pgn(),
          lastMove: moves[i],
        });
      }

      // 現在位置を最新に設定
      this.currentPosition = this.positionHistory.length - 1;
    }
  }

  // ナビゲーションボタンの有効/無効状態を返す
  getNavigationState() {
    return {
      canGoBack: this.currentPosition > 0,
      canGoForward: this.currentPosition < this.positionHistory.length - 1,
      isAtStart: this.currentPosition === 0,
      isAtEnd: this.currentPosition === this.positionHistory.length - 1,
    };
  }
}

// グローバルなHistoryManagerインスタンスを作成
const historyManager = new HistoryManager();
