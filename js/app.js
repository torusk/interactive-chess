// app.js - アプリケーション全体の初期化と、他のモジュールの連携を担当

// グローバルスコープで updateUI を定義（関数宣言を外に出す）
let updateUI;

// DOMが読み込まれた後に実行
$(document).ready(function () {
  // チェス盤の初期化
  chessBoard.initialize("board");

  // 履歴マネージャーの初期化
  historyManager.initialize(chessBoard.getGame().fen());

  // 盤面更新時のコールバックを設定
  updateUI = function () {
    const game = chessBoard.getGame();
    uiController.updateBoard(game);
    uiController.updateTurnIndicators(game);

    // 履歴表示を更新
    const historyHTML = historyManager.generateHistoryHTML();
    uiController.updateHistory(historyHTML);

    // ナビゲーションボタンの状態を更新
    const navState = historyManager.getNavigationState();
    uiController.updateNavigationButtons(navState);
  };

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
  
  // 初期局面ボタンは削除し、最初の局面へボタンに機能統合

  // UIイベントの設定
  setupUIEvents();
  
  // ページ読み込み後、高さを揃える
  setTimeout(adjustContainerHeights, 300);
  
  // ページ読み込み時に画面幅に応じて盤面サイズを自動調整
  autoAdjustBoardSize();
  
  // リサイズ時に盤面サイズを自動調整
  $(window).resize(function() {
    autoAdjustBoardSize();
  });

  // UIイベントの設定関数
  function setupUIEvents() {
    // リセットボタン
    $("#resetBtn").click(function () {
      chessBoard.resetBoard();
    });

    // 盤面反転ボタン
    $("#flipBtn").click(function () {
      chessBoard.flipBoard();
    });
    
    // FEN読み込みボタン
    $("#load-fen-btn").click(function() {
      loadFenFromInput();
    });
    
    // FEN入力フォームでEnterキーが押された場合も読み込みを実行
    $("#fen-input").keypress(function(e) {
      if (e.which === 13) {
        loadFenFromInput();
      }
    });
    
    // ボードサイズ変更ボタン
    $("#smallBoardBtn").click(function() {
      changeBoardSize('small');
    });
    
    $("#mediumBoardBtn").click(function() {
      changeBoardSize('medium');
    });
    
    $("#largeBoardBtn").click(function() {
      changeBoardSize('large');
    });

    // 初期局面ボタンは削除済み

    /* 将来の機能拡張のためにコメントアウト
    $("#clearBoardBtn").click(function () {
      chessBoard.clearBoard();
    });
    */

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
      loadPgnFromInput();
    });
    
    // PGN入力フォームでEnterキーが押された場合も読み込みを実行
    $("#pgn-import-input").keypress(function(e) {
      if (e.which === 13) {
        loadPgnFromInput();
      }
    });

    // 履歴の手をクリックしたときのイベント委任設定 - 新しい処理で置き換え
    $(document).on("click", ".history-move", function () {
      const moveIndex = $(this).data("move-index");
      const variationId = $(this).data("variation");
      const isMainLine = $(this).data("main-line");

      if (variationId && !isMainLine) {
        // 分岐の手をクリック
        const position = historyManager.goToVariation(variationId, moveIndex);
        if (position) {
          chessBoard.setPosition(position.fen);
          updateUI();
        }
      } else if (moveIndex !== undefined) {
        // 通常の手をクリック
        const targetPosition = parseInt(moveIndex) + 1;
        const position = historyManager.goToPosition(targetPosition);
        if (position) {
          chessBoard.setPosition(position.fen);
          updateUI();
        }
      }
    });

    // 分岐後にメインラインに戻るボタンのイベント処理
    $(document).on("click", ".return-to-main", function () {
      const position = $(this).data("position");
      const pos = historyManager.returnToMainLine(position);
      if (pos) {
        chessBoard.setPosition(pos.fen);
        updateUI();
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
  
  // 画面幅に応じて盤面サイズを自動調整する関数
  function autoAdjustBoardSize() {
    // 現在のウィンドウ幅を取得
    const windowWidth = $(window).width();
    
    // 画面幅に応じてサイズを切り替え
    if (windowWidth < 768) {
      // 小さい画面ではスモールサイズ
      changeBoardSize('small');
    } else if (windowWidth < 1200) {
      // 中程度の画面ではミディアムサイズ
      changeBoardSize('medium');
    } else {
      // 大きい画面ではラージサイズ
      changeBoardSize('large');
    }
  }
  
  // チェス盤のサイズを変更する関数
  function changeBoardSize(size) {
    // サイズに応じて幅を設定
    let width;
    if (size === 'small') {
      width = 320;
    } else if (size === 'medium') {
      width = 420;
    } else if (size === 'large') {
      width = 520;
    }
    
    // ボード要素にサイズクラスを適用
    const boardElement = $('#board');
    boardElement.removeClass('board-size-small board-size-medium board-size-large');
    boardElement.addClass('board-size-' + size);
    
    // サイズボタンのアクティブ状態を更新
    $('.size-btn').removeClass('size-btn-active');
    $('#' + size + 'BoardBtn').addClass('size-btn-active');
    
    // コントロールコンテナのサイズも一致させる
    $('.control-container').css('width', width + 'px');
    
    // チェス盤のサイズを変更
    chessBoard.resizeBoard(width);
    
    // 高さを揃える処理を追加（少し遅延させて盤面のレンダリングが完了するのを待つ）
    setTimeout(adjustContainerHeights, 100);
  }
  
  // 盤面とコントロールコンテナの高さを揃える関数
  function adjustContainerHeights() {
    const boardContainer = $('.board-container');
    const controlContainer = $('.control-container');
    
    // 一度高さをリセット
    boardContainer.css('height', 'auto');
    controlContainer.css('height', 'auto');
    
    // 少し遅延させて高さを計算
    setTimeout(() => {
      // どちらか高い方に合わせる
      const boardHeight = boardContainer.outerHeight();
      const controlHeight = controlContainer.outerHeight();
      const maxHeight = Math.max(boardHeight, controlHeight);
      
      boardContainer.css('height', maxHeight + 'px');
      controlContainer.css('height', maxHeight + 'px');
    }, 50);
  }
  
  // PGN入力フォームから読み込む機能
  function loadPgnFromInput() {
    const pgnInput = $("#pgn-import-input").val().trim();
    if (!pgnInput) {
      $("#pgn-input-error").text("PGNを入力してください").show();
      setTimeout(() => {
        $("#pgn-input-error").fadeOut();
      }, 3000);
      return;
    }
    
    try {
      // PGNを読み込み
      const result = pgnHandler.importPgn(pgnInput);
      
      // 新しいゲームをロード
      chessBoard.loadPgn(result.game);
      
      // 履歴を再構築
      historyManager.rebuildFromPGN(result.game, result.comments);
      
      // UI更新
      updateUI();
      
      // 成功時はエラー表示を非表示に
      $("#pgn-input-error").hide();
      
      // 入力フォームをクリア
      $("#pgn-import-input").val("");
      
    } catch (error) {
      console.error("PGN読み込みエラー:", error);
      
      // エラー表示
      $("#pgn-input-error").text("無効なPGN形式です: " + error.message).show();
      setTimeout(() => {
        $("#pgn-input-error").fadeOut();
      }, 3000);
    }
  }
  
  // FEN入力フォームから読み込む機能
  function loadFenFromInput() {
    const fenInput = $("#fen-input").val().trim();
    if (!fenInput) {
      $("#fen-input-error").text("FENを入力してください").show();
      setTimeout(() => {
        $("#fen-input-error").fadeOut();
      }, 3000);
      return;
    }
    
    // FENをセット
    const result = chessBoard.setPosition(fenInput);
    
    if (result.success) {
      // 成功時はエラー表示を非表示に
      $("#fen-input-error").hide();
      
      // 入力フォームをクリア
      $("#fen-input").val("");
      
      // 履歴を初期化
      historyManager.initialize(chessBoard.getGame().fen());
      updateUI();
      
    } else {
      // エラー表示
      $("#fen-input-error").text(result.error).show();
      setTimeout(() => {
        $("#fen-input-error").fadeOut();
      }, 3000);
    }
  }
});
