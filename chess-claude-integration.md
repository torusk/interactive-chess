# Claude用インタラクティブチェス連携ガイド

このガイドは、Claudeチャットとインタラクティブチェスアプリを連携させる方法を解説します。Playwright MCPサーバーを使用して、チャット内でチェス盤の操作やPGN形式の棋譜読み込みを自動化しまう。その備忘録です。

## 必要条件

- Node.js（http-serverをインストールするため）
- `interactive-chess`アプリ（デスクトップに配置）
- Claude Pro（MCP接続機能付き）
- Playwright MCPサーバー（MCPインストーラーで事前設定済み）

## セットアップ手順

### 1. HTTP-Serverのインストール（初回のみ）

```bash
npm install -g http-server
```

### 2. チェスアプリの起動

以下のコマンドをターミナルで実行します：

```bash
cd ~/Desktop/interactive-chess
http-server -p 8080
```

成功すると以下のような出力が表示されます：

```
Starting up http-server, serving ./

http-server version: 14.1.1

http-server settings: 
CORS: disabled
Cache: 3600 seconds
Connection Timeout: 120 seconds
Directory Listings: visible
AutoIndex: visible
Serve GZIP Files: false
Serve Brotli Files: false
Default File Extension: none

Available on:
  http://127.0.0.1:8080
  http://192.168.x.x:8080
Hit CTRL-C to stop the server
```

これでチェスアプリが http://localhost:8080 でアクセス可能になりました。

## Claudeからの操作方法

### 基本的な操作手順

1. サーバーを起動したまま、Claudeチャットを開きます
2. 以下のようなコマンドをチャットに入力して、Playwrightによるブラウザ操作を依頼します：

```
チェスアプリを開いて、シシリアンディフェンスの棋譜を読み込んでください。
```

3. Claudeが自動的にPlaywright MCPサーバーを使用してブラウザを操作します

### Playwright操作コマンド例

以下はClaudeが使用するコマンド例です（参考）：

```javascript
await browser_navigate({ url: "http://localhost:8080/index.html" });
await browser_wait({ time: 2 });

// PGNを読み込む
await browser_click({ 
  element: "PGN入力エリア", 
  ref: "#pgn-import-textarea" 
});
await browser_type({
  element: "PGN入力エリア",
  ref: "#pgn-import-textarea",
  text: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6",
  submit: false
});
await browser_click({
  element: "棋譜読み込みボタン",
  ref: "#import-pgn-btn"
});
```

## 主な操作例

### PGN棋譜の読み込み

Chess.comなどで保存した棋譜をClaudeチャットに貼り付け、以下のように依頼します：

```
この棋譜をチェスアプリに読み込んでください。
```

Claudeは自動的に：
1. ブラウザでチェスアプリを開く
2. PGN入力エリアをクリック
3. 貼り付けられた棋譜を入力
4. 「棋譜を読み込む」ボタンをクリック

という操作を行います。

### 棋譜の分析

棋譜が読み込まれた後、以下のような操作が可能です：

```
この対局の5手目以降の局面を表示して、黒の課題となった手を分析してください。
```

Claudeは棋譜を読み込んだ後、ナビゲーションボタンを操作して指定の局面に移動し、分析を提供します。

## トラブルシューティング

- **ブラウザが開かない場合**: http-serverが正常に動作していることを確認してください
- **エラーが表示される場合**: http-serverを再起動してみてください
- **要素が見つからないエラー**: チェスアプリのHTMLが変更された可能性があります

## 注意点

- http-serverを実行中はターミナルウィンドウを閉じないでください
- Playwrightで開いたブラウザは自由に操作できますが、Claudeが自動操作中は干渉しないことをお勧めします

---

このガイドは、Claudeとインタラクティブチェスアプリの連携設定の基本を解説しています。より詳細な設定や拡張については、MCPサーバーのドキュメントを参照してください。
