# 易の余白 — AI易経Webアプリ

易経64卦の算出・解釈、手書き卦の画像認識、LINE連携、Stripe定期決済に対応する日本語Webアプリです。PCとスマートフォンのブラウザーで利用できます。

> 易経の結果は自己省察のための参考情報です。未来を保証するものではなく、医療・法律・金融などの専門的助言の代わりにはなりません。

## 起動

必要環境はNode.js 20.9以降です。

```bash
npm install
cp .env.example .env.local
npm run dev
```

`http://localhost:3000` を開きます。APIキーを登録しない場合も、卦の算出とローカル解釈は動作します。

## AI APIキー

画面下部の「AI設定」からOpenAI・Gemini・Anthropicのうち1社を選び、そのAPIキーを登録します。同じキーで通常の質問別解釈と手書き卦の画像認識を利用できます。API利用料は選択したプロバイダーから別途請求されます。

キーはブラウザーの`sessionStorage`に保存され、タブ/セッション終了時に消去されます。利用時にHTTPS経由でこのWebアプリのサーバーへ送信し、サーバーから選択したAIプロバイダーへ転送します。アプリのデータベースやログには保存しません。手書き認識では画像もAIプロバイダーへ送信され、アプリ側では保存しません。共有端末では利用後にキーを削除してください。APIキー入力ページを提供するWebアプリの運営元を信頼できる場合にのみ登録してください。

運営者がサーバー側にキーを設定する場合は`.env.local`に`AI_PROVIDER`（`openai`、`gemini`、`anthropic`）と対応する`OPENAI_API_KEY`、`GEMINI_API_KEY`、`ANTHROPIC_API_KEY`を設定します。実キーをGitHubにコミットしないでください。

## メールログインと3日間お試し

基本のコイン占いとローカル解釈は、APIキー・ログインなしで使えます。AI解釈と手書き認識は、Supabaseを接続するとメールアドレスと8文字以上のパスワードで始める72時間の試用対象になります。期限はサーバー側で設定され、利用者は延長・変更できません。

1. Supabaseでこのアプリ専用の東京リージョン（`ap-northeast-1`）プロジェクトを作成します。
2. SQL Editorで[`supabase/schema.sql`](supabase/schema.sql)を実行します。作成されるテーブルとトリガーはすべて`iching_ai_app_`プレフィックス付きです。
3. Authentication → Providers → Emailの「Confirm email」を無効にします。これにより、登録直後にログインできます。
4. VercelのProduction環境変数に`NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`を設定します。Publishable keyはブラウザー向けですが、service-role keyは絶対に公開しません。

確認メールを無効にする運用では、メールアドレスの誤登録も即時に試用枠を消費します。公開運用ではSupabase Authのレート制限とパスワードリセット用SMTPも必ず設定してください。

## 主な機能

- コイン法・筮竹法による本卦、変爻、之卦の算出
- 64卦一覧と日本語解釈
- OpenAI / Gemini / Anthropicによる質問別のAI解釈
- スマートフォンからの手書き卦写真撮影・AI認識
- LINE Messaging APIの「今日の卦」Webhook
- Stripe Checkout、契約状態確認、顧客ポータル
- 東京リージョンのSupabase接続オプションと、認証済み日次ヘルスチェック

LINEとStripeは各サービスの開発者アカウントおよび環境変数を設定した場合に有効です。LINE Webhook署名を検証します。Stripe決済を有効化する前にテストモードで商品・Webhookを確認してください。Stripe価格設定が有効な環境では、手書き認識をプレミアム/法人契約に制限します。

## 動作確認

```bash
npm run verify
npm run lint
npm run build
```

実AI認識の確認には、上記のいずれかの有効なAPIキーとプロバイダー側の利用枠が必要です。APIキーがない環境ではアプリが安全に503を返し、キーを画面やログへ露出しません。

## Vercelへのデプロイ

CLIで実行する場合、`vercel login`で認証してからこのリポジトリ直下で`vercel link`、VercelのProduction用環境変数設定、`vercel --prod`の順に実行します。GitHub Actions/CLIのトークンはリポジトリへ書かず、各CLIの安全なログインストアまたはCI Secretで管理します。

1. GitHubリポジトリをVercelにImportし、Framework PresetがNext.js、Root Directoryが`./`であることを確認します。
2. Supabaseを使う場合は新規プロジェクト作成時にリージョン「Northeast Asia (Tokyo) / `ap-northeast-1`」を選びます。既存プロジェクトのリージョンを後から切り替えるのではなく、必要なら東京に新規作成して移行します。
3. Supabase SQL Editorで[`supabase/schema.sql`](supabase/schema.sql)を実行します。VercelのProduction環境変数に`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、ランダムな`CRON_SECRET`を設定します。service-roleキーはサーバー専用で、`NEXT_PUBLIC_`を付けず、ブラウザーへ送らないでください。
4. `AI_PROVIDER`と対応するサーバー側AIキー（必要な場合）、LINE・Stripeの必要な環境変数をVercel側へ登録します。ローカルの`.env.local`はGitHubへコミットしません。
5. Deploy後、`https://<your-domain>/api/health`が`{"status":"ok"}`を返すことを確認します。CronはVercelが認証ヘッダー付きで日次実行し、Supabaseの接続確認だけを行います。

[`vercel.json`](vercel.json) はVercel Functionsを東京（`hnd1`）に配置し、毎日03:00 UTC（日本時間12:00）にヘルスチェックを実行する設定です。CronはHobbyプランの最短頻度である日次に合わせています。

### スリープと常時稼働について

Vercel Functionsはサーバーレスのため、アイドル中に実行環境が休止し、次回アクセス時に起動する場合があります。Cronは定期的な接続確認ですが、Functionを常時起動状態に保つ保証はありません。また、Supabase Freeは低利用の状態が続くとプロジェクトを自動休止することがあります。日次アクセスは休止回避に役立つことがありますが、Supabaseが保証する方法ではありません。確実に自動休止を避けたい本番運用ではSupabase有料プランを選択してください。Vercelの常時稼働やPro機能も別途プラン・料金条件を確認してください。

実データを保存する機能を追加する場合は、RLSを有効にし、利用者ごとの認証・アクセス制御を設計してからテーブルを作成してください。現状のキープアライブテーブルは接続確認専用で、質問やAPIキーを保存しません。

## 補足

記事のサンプルでは一部の卦対応に取り違えがあったため、初爻から上爻の陰陽配列を標準の文王卦序に照合しています。64卦すべての構造を扱いますが、完全な古典本文や専門鑑定を提供するものではありません。
