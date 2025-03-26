// ui-controller.js - ユーザーインターフェースの制御を担当するモジュール

class UIController {
  constructor() {
    // UIに関する状態を初期化
  }

  // 手番インジケータを更新
  updateTurnIndicators(game) {
    if (game.turn() === "w") {
      $("#white-turn-indicator")
        .text("手番")
        .removeClass("not-turn")
        .addClass("current-turn");
      $("#black-turn-indicator")
        .text("待機中")
        .removeClass("current-turn")
        .addClass("not-turn");
    } else {
      $("#white-turn-indicator")
        .text("待機中")
        .removeClass("current-turn")
        .addClass("not-turn");
      $("#black-turn-indicator")
        .text("手番")
        .removeClass("not-turn")
        .addClass("current-turn");
    }
  }

  // エラーメッセージを表示
  showMoveError(color, message) {
    $(`#${color}-move-error`).text(message).show();
    setTimeout(() => {
      $(`#${color}-move-error`).fadeOut();
    }, 3000);
  }

  // 盤面の状態を更新
  updateBoard(game) {
    // PGNとFEN表示は非表示にしたので処理をコメントアウト
    // $("#current-fen").text(game.fen());
    // $("#pgn-display").text(game.pgn());
  }

  // 履歴表示を更新
  updateHistory(html) {
    $("#history").html(html);
  }

  // ボタンの有効/無効状態を更新
  updateNavigationButtons(state) {
    $("#prevMoveBtn").prop("disabled", !state.canGoBack);
    $("#nextMoveBtn").prop("disabled", !state.canGoForward);
    $("#firstMoveBtn").prop("disabled", !state.canGoBack);
    $("#lastMoveBtn").prop("disabled", !state.canGoForward);
  }

  // クリップボードにテキストをコピー
  copyToClipboard(text) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch((err) => {
        // クリップボードAPIがサポートされていない場合の代替手段
        try {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          return true;
        } catch (e) {
          console.error("クリップボードへのコピーに失敗しました:", e);
          return false;
        }
      });
  }
}

// グローバルなUIControllerインスタンスを作成
const uiController = new UIController();
