# Birthy UI 実装

添付ZIPの既存 Next.js 16.3.8 / React / TypeScript / Tailwind / App Router プロジェクトを直接編集しています。`app/`, `lib/`, `public/` の構成と既存の依存関係を維持しました。

## 起動

```sh
npm ci
```

既存のSupabase接続設定を `.env.local` に設定してください（`.env.example` に変数名のみ記載しています）。秘密鍵はサーバー専用です。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=既存のSupabaseプロジェクトURL
SUPABASE_SECRET_KEY=既存のサーバー用Secret Key
```

```sh
npm run dev
npm run lint
npm run build
npm start
```

UIは接続設定がなくても開発サーバー上で操作できます。ID確認は接続に失敗するとエラーを表示し、ID省略で登録を進められます。既存サーバークライアントは環境変数未設定時に例外を投げる設計のため、通常の本番ビルドには接続設定が必要です。

## 画面

| URL | 内容 |
| --- | --- |
| `/`, `/onboarding` | ウェルカム → プロフィール → 誕生日 → 任意ID → プライバシー → 確認 → 完了 |
| `/home` | 今日・明日の誕生日 |
| `/birthday/misaki` | 誕生日ページ、公開Birthday Wall、メッセージの「…」メニュー |
| `/birthday/misaki/message` | 少数リアクション、任意メッセージ、公開範囲、風船を添える |
| `/birthday/misaki/balloons` | 個数選択、カスタム、相手・年度ごとの累計上限100個 |
| `/success` | お祝い送信完了、ホームに戻る |
| `/connections` | つながり、申請、ID検索、招待リンク、QR、サークル |
| `/notifications` | すべて・未読、既読操作、関連画面への移動 |
| `/mypage` | プロフィール、つながり・所属サークル、設定関連の親画面 |
| `/received` | 本人だけの受信メッセージ・風船数と送信者一覧（順位なし） |
| `/mypage/profile` | 画像・ニックネームの編集 |
| `/mypage/birthday`, `/mypage/id` | 誕生日・任意Birthy IDを個別に編集 |
| `/mypage/privacy` | 生年月日表示・ID検索・申請 |
| `/mypage/notifications` | 前日9時・当日9時・Birthyのお知らせ |
| `/mypage/account`, `/mypage/blocked` | LINE連携状態、任意メール、ブロック解除、デモ削除 |
| `/mypage/terms`, `/mypage/policy`, `/mypage/contact` | 正式文面・連絡先の掲載待ち |
| `/settings`, `/settings/*` | 対応するマイページURLへredirect（旧legalはterms） |

最初は `/` から登録します。`/home` を直接開くとデモデータのUIを確認できます。登録時のサークル加入はありません。

## 最終ポリッシュ

- 日本語フォントはM PLUS Rounded 1cの400・500・700。`next/font`で自分の配信元から読み込みます。Unicode範囲ごとに必要な文字を読み込むため、一括先読みは無効にしました。
- 軽い画面・カード登場、ボタン、Bottom Sheet、Toggle、タブIndicator、成功チェック、いいねPop、最大6個の風船、少数の一度だけの紙吹雪をCSSで実装。`prefers-reduced-motion`に対応します。
- マイページを設定関連の親画面に統合しました。子画面の「戻る」はマイページへ戻り、通常のブラウザBack/Forwardも使えます。
- 誕生日カードは日本時間の前日0時から当日23:59:59まで送れます。前日のカードは本文・送信者・画像・リアクションを描画せず、本人には件数だけを表示します。当日0時に公開判定を更新します。本人限定カードは公開Wallに表示しません。
- 公開メッセージだけに追加/解除できるいいねを実装しました。本人のいいねは小さなピンクの「本人」バッジ、他ユーザーの人数は控えめな別表示です。
- 既存localStorageデータを読み込めるよう、公開日時といいねの追加に移行処理を用意しました。日時由来の初期モックはサーバーから渡す同じ日時を使用し、Hydrationのずれを防ぎます。

時間と本人判定は `lib/birthy/birthday-cards.ts`、0時の自動更新は `use-birthday-clock.tsx`、保存境界は `store.ts` の `sendMessage()` と `toggleMessageLike(messageId,userId)` です。将来はここで認証済みAPIとサーバー時刻に接続してください。今回のlocalStorageによる非表示はUIの検証用で、本番のアクセス制御にはサーバー側の認可が必要です。LINE Login・DB Schema・RLSは変更していません。

意味のある日付境界・本人いいねのテストは既存TypeScriptとNodeの標準テストだけで動きます。

```sh
node --test tests/birthday-cards.test.mjs
```

2月29日生まれは平年の2月28日を誕生日として扱います。正式運用前にこの扱いを確定してください。

## 実APIとデモの境界

- `GET /api/birthy-id/check?id=...`：既存APIを実際に呼びます。400ms debounce、AbortController、入力世代管理で古い応答を破棄。確認失敗を利用可能と扱いません。登録・プロフィール変更で共通利用します。
- `GET /api/health/db`、`lib/supabase/admin.ts`：元ZIPから変更していません。依存ファイル・DBスキーマ・RLSにも変更はありません。
- プロフィール登録、メッセージ、公開予約、いいね、風船、申請、サークル、設定、メール、ブロック、既読：型付きデータとブラウザ内状態で動作します。`localStorage` に保存し、利用できないときはメモリ内で動作します。
- 公開Wallは必ず `visibility === 'public'` のみを表示します。本人宛の非公開メッセージは受信画面に表示します。
- 風船上限は送信者・相手・日本時間の誕生日年度ごとに判定します。受信者別集計は到着順で、個数による順位付けはありません。
- 通報は端末に保存するデモです。運営には送信しません。アカウント削除もブラウザ内デモ状態のリセットです。
- 招待QRは現在のURLを符号化する実際のQRです。招待プロフィールの解決と申請はデモです。共有はユーザーの操作で行います。

## LINE Login 接続箇所

`lib/birthy/line-login.ts` の `beginLineLogin()` を、LINE Login / LIFF の開始処理に差し替えます。呼び出し元は `components/onboarding/onboarding.tsx` の `login()` です。認証後にサーバーで検証済みセッションを作成し、`lib/birthy/store.ts` の登録・更新処理を認証済みAPIに接続してください。`server-only` のSupabase adminをClient Componentから import しないでください。

## 検証結果と制限

- Next.js本番build、TypeScript、ESLint：成功。
- 最新ポリッシュは320 / 390 / 1280pxの本番画面33表示、モーション・フォント42表示と15操作、マイページ19項目を確認。横はみ出し・画像エラー・Console重大エラー・Hydration Errorなし。
- ブラウザで前日カード送信、0時の自動公開、公開／本人限定の分離、いいね追加／解除と本人バッジ、戻る／Back／Forwardを確認。登録・debounce・古い応答破棄・風船累計上限・年度更新・非表示/ブロック・申請・QR・サークル・設定保存の回帰も確認しました。
- 保護対象の2 API、admin.ts、package.json、package-lock.jsonは元ZIPとハッシュ一致。クライアントbundleにSecret Key参照・サーバーRPCコードがないことを確認しました。
- **元ZIPに `.env.local` がないため、Supabase実DBの正常応答と実ID空き判定の成功は未検証です。** build検証時だけプロセス内に無効な検証用値を設定しました。秘密鍵や検証用値をソース・ZIPへ保存していません。接続失敗時のUIは実API呼び出しで確認しました。ID利用可/使用済みのUIはブラウザテストで応答を制御して確認しています。
- LINE認証、DB永続化とサーバー側認可、通知配信、メール確認、招待管理、運営への通報、本番のアカウント削除は接続待ちです。公開前に正式規約・ポリシー・問い合わせ先を配置してください。
- 既存の開発用ESLint依存に監査high 5件（braces関連）がありました。既存依存の保護を優先し変更していません。本番依存の監査結果は0件でした。

## 主な構成

- `app/page.tsx`, `app/[...view]/page.tsx`：既存App RouterにUIを接続。
- `components/birthy/birthy-app.tsx`：画面ルーティング。`home.tsx`, `ui.tsx`：ホーム・共通UI。
- `components/onboarding/`：ステップごとのフォーム部品。
- `components/birthday/`：誕生日Wall、メッセージ、風船、受信、完了。
- `components/connections/`, `notifications/`, `settings/`, `navigation/`：各画面と下部4項目ナビ。
- `types/birthy.ts`, `lib/birthy/`：型、デモデータ、状態、日付処理、IDチェック、認証接続箇所。
- `public/birthy/`：添付デザインに合わせた空・雲・風船と架空成人プロフィール画像（生成素材）。軽量WebPを使用。
