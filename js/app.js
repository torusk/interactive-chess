// app.js - アプリケーション全体の初期化と、他のモジュールの連携を担当

// DOMが読み込まれた後に実行
$(document).ready(function () {
  // チェス盤の初期化
  chessBoard.initialize("board");

  // 履歴マネージャーの初期化
  historyManager.initialize(chessBoard.getGame().fen());

  // 盤面更新時のコールバックを設定
  function updateUI() {
    const game = chessBoard.getGame();
    uiController.updateBoard(game);
    uiController.updateTurnIndicators(game);

    // 履歴表示を更新
    const historyHTML = historyManager.generateHistoryHTML();
    uiController.updateHistory(historyHTML);

    // ナビゲーションボタンの状態を更新
    const navState = historyManager.getNavigationState();
    uiController.updateNavigationButtons(navState);
  }

  // 履歴を初期化して表示
  updateUI();

  // 指し手が行われた時のコールバック
  chessBoard.setMoveCallback(function (move, game) {
    historyManager.addMove(move, game);
    updateUI();
  });

  // 盤面リセット時のコールバック
  chessBoard.setResetCallback(function (game) {
    historyManager.initialize(game.fen());
    updateUI();
  });

  // UIイベントの設定
  setupUIEvents();

  // UIイベントの設定関数
  function setupUIEvents() {
    // ボタン処理
    $("#resetBtn").click(function () {
      chessBoard.resetBoard();
    });

    $("#flipBtn").click(function () {
      chessBoard.flipBoard();
    });

    $("#startPositionBtn").click(function () {
      chessBoard.setStartPosition();
    });

    $("#clearBoardBtn").click(function () {
      chessBoard.clearBoard();
    });

    // 記法入力による駒の移動処理
    $("#white-move-btn").click(function () {
      makePlayerMove("white");
    });

    $("#black-move-btn").click(function () {
      makePlayerMove("black");
    });

    // Enterキーで駒を動かす
    $("#white-move-input").keypress(function (e) {
      if (e.which === 13) {
        makePlayerMove("white");
      }
    });

    $("#black-move-input").keypress(function (e) {
      if (e.which === 13) {
        makePlayerMove("black");
      }
    });

    // 最初の局面へ移動するボタン
    $("#firstMoveBtn").click(function () {
      const position = historyManager.goToFirstPosition();
      if (position) {
        chessBoard.setPosition(position.fen);
        updateUI();
      }
    });

    // 最後の局面へ移動するボタン
    $("#lastMoveBtn").click(function () {
      const position = historyManager.goToLastPosition();
      if (position) {
        chessBoard.setPosition(position.fen);
        updateUI();
      }
    });

    // 前の手に戻るボタン
    $("#prevMoveBtn").click(function () {
      const position = historyManager.goToPreviousMove();
      if (position) {
        chessBoard.setPosition(position.fen);
        updateUI();
      }
    });

    // 次の手に進むボタン
    $("#nextMoveBtn").click(function () {
      const position = historyManager.goToNextMove();
      if (position) {
        chessBoard.setPosition(position.fen);
        updateUI();
      }
    });

    // 履歴をコピーするボタン
    $("#copyHistoryBtn").click(function () {
      const clipboardText = pgnHandler.formatGameInfoForClipboard(
        chessBoard.getGame()
      );

      uiController.copyToClipboard(clipboardText).then((success) => {
        if (success) {
          alert("局面情報をクリップボードにコピーしました");
        } else {
          alert("コピーに失敗しました");
        }
      });
    });

    // PGN棋譜読み込みボタン
    $("#import-pgn-btn").click(function () {
      const pgnText = $("#pgn-import-textarea").val().trim();
      if (!pgnText) {
        alert("棋譜を入力してください");
        return;
      }

      try {
        // PGNを読み込み
        const result = pgnHandler.importPgn(pgnText);

        // 新しいゲームをロード
        chessBoard.loadPgn(result.game);

        // 履歴を再構築
        historyManager.rebuildFromPGN(result.game, result.comments);

        // UI更新
        updateUI();

        // インポート成功のメッセージ
        alert("棋譜を正常に読み込みました");

        // テキストエリアをクリア
        $("#pgn-import-textarea").val("");
      } catch (error) {
        console.error("PGN読み込みエラー:", error);
        alert("棋譜の読み込み中にエラーが発生しました: " + error.message);
      }
    });

    // 履歴の手をクリックしたときのイベント委任設定
    $(document).on("click", ".history-move", function () {
      const moveIndex = $(this).data("move-index");
      if (moveIndex !== undefined) {
        // moveIndexが0から始まるので、初期状態は0、最初の手は1
        const targetPosition = parseInt(moveIndex) + 1;
        const position = historyManager.goToPosition(targetPosition);
        if (position) {
          chessBoard.setPosition(position.fen);
          updateUI();
        }
      }
    });
  }

  // 記法による駒の移動処理
  function makePlayerMove(color) {
    const moveInput = $(`#${color}-move-input`).val().trim();
    const result = chessBoard.makeMove(color, moveInput);

    if (result.success) {
      // 駒が動かせた場合
      $(`#${color}-move-input`).val("");
      $(`#${color}-move-error`).hide();
    } else {
      // 無効な手の場合
      uiController.showMoveError(color, result.error);
    }
  }
});
