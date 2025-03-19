// pgn-handler.js - PGN形式の処理を担当するモジュール

class PgnHandler {
  constructor() {
    // 初期化
  }

  // PGNからコメントを抽出する関数
  extractComments(pgnText) {
    const comments = {};

    // コメントを抽出する正規表現
    const commentRegex = /(\d+\.\s*\S+\s*(?:\S+)?)(?:\s*\{([^}]+)\})?/g;

    let match;
    while ((match = commentRegex.exec(pgnText)) !== null) {
      // 手と関連するコメントを取得
      const move = match[1].trim();
      const comment = match[2] ? match[2].trim() : null;

      if (comment) {
        comments[move] = comment;
      }
    }

    return comments;
  }

  // PGNからコメントなどを削除して、chess.jsが読み込めるようにクリーンアップする関数
  cleanPgnForImport(pgnText) {
    // PGNヘッダーとゲーム部分を分離
    const headerEndIndex = pgnText.lastIndexOf("]") + 1;
    const headers = pgnText.substring(0, headerEndIndex);
    let moves = pgnText.substring(headerEndIndex);

    // コメントを削除 (波括弧内のテキスト)
    moves = moves.replace(/\{[^}]*\}/g, "");

    // $1, $2などのアノテーションを削除
    moves = moves.replace(/\$\d+/g, "");

    // 余分な空白を整理
    moves = moves.replace(/\s+/g, " ").trim();

    return headers + " " + moves;
  }

  // PGNを読み込む
  importPgn(pgnText) {
    if (!pgnText.trim()) {
      throw new Error("No PGN text provided");
    }

    try {
      // PGNテキストからコメントを抽出して保存
      const comments = this.extractComments(pgnText);

      // コメントを削除したPGNをチェスエンジンに読み込ませる
      const cleanPgn = this.cleanPgnForImport(pgnText);

      // 新しいゲームインスタンスを作成して棋譜を読み込む
      const newGame = new Chess();
      const success = newGame.load_pgn(cleanPgn);

      if (success) {
        return {
          game: newGame,
          comments: comments,
        };
      } else {
        throw new Error("Failed to load PGN");
      }
    } catch (error) {
      console.error("PGN import error:", error);
      throw new Error("Error parsing PGN: " + error.message);
    }
  }

  // 棋譜情報をコピー用に整形
  formatGameInfoForClipboard(game) {
    const fen = game.fen();
    const pgn = game.pgn();
    const turn = game.turn() === "w" ? "白" : "黒";
    const history = game.history().join(", ");

    return `【チェス局面情報】
手番: ${turn}
FEN: ${fen}
指し手の履歴: ${history}
PGN: ${pgn}`;
  }
}

// グローバルなPgnHandlerインスタンスを作成
const pgnHandler = new PgnHandler();
