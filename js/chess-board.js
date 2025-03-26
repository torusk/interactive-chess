// chess-board.js - チェス盤の操作に関するモジュール

class ChessBoard {
  constructor() {
    this.board = null;
    this.game = new Chess();
    this.boardConfig = {
      draggable: true,
      pieceTheme:
        "https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png",
      position: "start",
      onDragStart: this.onDragStart.bind(this),
      onDrop: this.onDrop.bind(this),
      onSnapEnd: this.onSnapEnd.bind(this),
    };
  }

  // チェス盤を初期化
  initialize(elementId) {
    // レスポンシブ対応のために幅を取得
    const boardElement = document.getElementById(elementId);
    const containerWidth = boardElement.parentElement.clientWidth - 30; // パディングを考慮
    const boardWidth = Math.min(400, containerWidth); // 最大400px、それ以下ならコンテナの幅に合わせる
    
    // 盤面の幅を設定
    this.boardConfig.width = boardWidth;
    
    this.board = Chessboard(elementId, this.boardConfig);
    
    // ウィンドウのリサイズ時に盤面の大きさを再計算
    window.addEventListener('resize', () => {
      const newContainerWidth = boardElement.parentElement.clientWidth - 30;
      const newBoardWidth = Math.min(400, newContainerWidth);
      this.board.resize();
    });
    
    return this.board;
  }

  // ドラッグ開始時のチェック
  onDragStart(source, piece, position, orientation) {
    // 動かす駒が現在の手番のものかチェック
    if (this.game.game_over()) return false;

    // 白の駒は'w'で始まり、黒の駒は'b'で始まる
    if (
      (this.game.turn() === "w" && piece.search(/^b/) !== -1) ||
      (this.game.turn() === "b" && piece.search(/^w/) !== -1)
    ) {
      return false;
    }

    return true;
  }

  // 駒をドロップしたときの処理
  onDrop(source, target) {
    // 有効な手かチェック
    const move = this.game.move({
      from: source,
      to: target,
      promotion: "q", // クイーンに昇格（必要な場合）
    });

    // 無効な手の場合は元に戻す
    if (move === null) return "snapback";

    // 手が指された後のイベントをトリガー
    if (typeof this.onMoveCallback === "function") {
      this.onMoveCallback(move, this.game);
    }

    return undefined;
  }

  // 駒がスナップした後の処理
  onSnapEnd() {
    this.board.position(this.game.fen());
  }

  // 記法で駒を動かす関数
  makeMove(color, moveInput) {
    if (!moveInput.trim()) {
      return {
        success: false,
        error: "手が入力されていません",
      };
    }

    // 現在の手番を確認
    const currentTurn = this.game.turn();
    if (
      (color === "white" && currentTurn !== "w") ||
      (color === "black" && currentTurn !== "b")
    ) {
      return {
        success: false,
        error: "現在の手番ではありません",
      };
    }

    try {
      // チェス記法をいくつか試す
      let move = null;

      // 1. 標準代数記法 (SAN) を試す - e4, Nf3など
      try {
        move = this.game.move(moveInput);
      } catch (e) {
        // 失敗してもエラーを表示しない
      }

      // 2. 長い代数記法 - e2e4, g1f3など
      if (!move && moveInput.length >= 4) {
        const from = moveInput.substring(0, 2);
        const to = moveInput.substring(2, 4);

        // プロモーションの処理
        let promotion = undefined;
        if (moveInput.length > 4) {
          const promotionPiece = moveInput.substring(4, 5).toLowerCase();
          if (["q", "r", "b", "n"].includes(promotionPiece)) {
            promotion = promotionPiece;
          }
        }

        try {
          move = this.game.move({
            from: from,
            to: to,
            promotion: promotion,
          });
        } catch (e) {
          // 失敗してもエラーを表示しない
        }
      }

      if (move) {
        // 駒が動かせた場合
        this.board.position(this.game.fen());

        // 手が指された後のイベントをトリガー
        if (typeof this.onMoveCallback === "function") {
          this.onMoveCallback(move, this.game);
        }

        return {
          success: true,
          move: move,
        };
      } else {
        // 無効な手の場合
        return {
          success: false,
          error: "無効な手です。再入力してください。",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: "無効な手です: " + error.message,
      };
    }
  }

  // 盤面をリセット
  resetBoard() {
    this.game = new Chess();
    this.board.position("start");

    // リセット後のイベントをトリガー
    if (typeof this.onResetCallback === "function") {
      this.onResetCallback(this.game);
    }
  }

  // 盤面を反転
  flipBoard() {
    this.board.flip();
  }

  // 初期配置に戻す
  setStartPosition() {
    // 履歴は保持したまま、表示だけ初期配置に戻す
    this.board.position("start");
    
    // 現在の履歴は維持しつつ、表示を初期配置に戻したことを通知
    if (typeof this.onStartPositionCallback === "function") {
      this.onStartPositionCallback(this.game);
    }
  }

  // すべての駒を取り除く
  clearBoard() {
    this.game = new Chess("8/8/8/8/8/8/8/8 w - - 0 1");
    this.board.position("8/8/8/8/8/8/8/8");

    // 盤面をクリアした後のイベントをトリガー
    if (typeof this.onResetCallback === "function") {
      this.onResetCallback(this.game);
    }
  }

  // 特定のFENの局面を設定
  setPosition(fen) {
    this.game = new Chess(fen);
    this.board.position(fen);
  }

  // イベントコールバックの設定
  setMoveCallback(callback) {
    this.onMoveCallback = callback;
  }

  setResetCallback(callback) {
    this.onResetCallback = callback;
  }

  setStartPositionCallback(callback) {
    this.onStartPositionCallback = callback;
  }

  // 現在のゲームインスタンスを取得
  getGame() {
    return this.game;
  }

  // PGNをロード
  loadPgn(game) {
    this.game = game;
    this.board.position(game.fen());
  }
}

// グローバルなChessBoardインスタンスを作成
const chessBoard = new ChessBoard();
