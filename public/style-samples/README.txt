AI画像生成 スタイル参照ライブラリ
======================================

このフォルダに過去の料理写真などを置いて、`manifest.json` に登録すると、
メニュー編集画面で「AIで料理画像を自動生成」した際、料理名・食材から
最もスタイルが近い 1〜2 枚が自動選択され、Gemini に渡されます。

■ ファイルを追加する手順
  1. JPEG または PNG の画像をこのフォルダに置く（推奨：長辺 1024〜1600px / 1MB 以下）
  2. `manifest.json` の "samples" 配列に1エントリ追加：

     {
       "id": "your-unique-id",              // 識別子（任意の英数）
       "file": "your-image.jpg",            // このフォルダ内のファイル名
       "categories": ["和食", "煮物"],       // ←料理名や説明に含まれていればヒット（3点/件）
       "keywords": ["味噌", "出汁"],         // ←食材名や説明に含まれていればヒット（1点/件）
       "promptHints": "dark ceramic bowl top thirty degree angle soft natural lighting plain background"
                                            // ←Gemini無しでも使う英語のスタイルヒント
     }

  3. ブラウザをリロード（manifest はキャッシュされるので Ctrl+Shift+R 推奨）

■ "default" カテゴリ
  どのキーワードにもヒットしなかった場合、`categories` に "default" を含む
  サンプルが1枚だけフォールバックとして使われます。

■ プライバシー・著作権
  ここに置く画像は静的アセットとしてアプリにバンドル/配信されます。
  撮影者・被写体の権利確認が済んだものだけを置いてください。

■ コストについて
  - 画像生成（pollinations.ai）: 完全無料・無認証
  - Gemini（任意・あれば自動で使う）: 1リクエスト ≈ $0.0001（実質ゼロ）
  - APIキー未設定でも、上記の promptHints + 料理名/食材で動きます

■ 重要：pollinations.ai プロキシについて
  pollinations.ai は 2024〜2025 に Cloudflare Turnstile を導入し、
  ブラウザから直接アクセスすると 403（Missing Turnstile token）で拒否されます。
  本アプリは Vite 開発サーバーの `/pollinations-proxy` 経由で
  サーバーサイドからアクセス（Origin/Referer 除去）することで回避しています。

  ▼ 本番デプロイ時（vite build 後のホスティング先）
  同様に `/pollinations-proxy/*` を pollinations.ai へ転送する
  サーバーレス関数を用意してください。例：
    - Cloudflare Workers / Pages Functions
    - Vercel Edge Functions / Netlify Functions
    - Firebase Hosting + Cloud Functions
  実装は10行程度で済みます（fetch して body をそのまま返すだけ）。
