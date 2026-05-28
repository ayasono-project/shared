# @ayasono/shared

ayasono プロジェクト（saika / hibiki / amane / web）の共通インフラパッケージ。

## 配布方式

各アプリの `package.json` から **git タグ参照**で取り込みます。`dist/` は**ビルド済みでリポジトリにコミット**しており、git 依存は pnpm が integrity を記録するため、consumer 側は **インストール時ビルド（prepare/tsup）も認証も不要**です（git タグ + コミット済み dist 方式）。

```json
{
  "dependencies": {
    "@ayasono/shared": "github:ayasono-project/shared#v0.2.2"
  }
}
```

> リリース手順: `pnpm build` で `dist/` を更新 → `dist/` ごとコミット → version を bump → タグを切って push。タグ push 時に CI（`.github/workflows/release.yml`）が「コミット済み dist が最新ビルドと一致するか（stale 検出）+ lint/typecheck/test」を検証する。

ローカルで shared を編集しながら各アプリで検証する場合は、アプリ側の `pnpm-workspace.yaml` に開発用 override を置く（例: saika）。詳細は `infra/docs/LOCAL_DEV.md`。

```yaml
overrides:
  "@ayasono/shared": "link:../shared"
```

- **Public**: 内容は汎用インフラコード（ロガー / JWT / Prisma 初期化 等）で機密性ゼロ。Coolify ビルド時の認証セットアップを不要にするため Public で公開。
- **Coolify 対象外**: このリポジトリ自体はデプロイ対象ではありません。各アプリの `pnpm install` 経由でビルドされます（`prepare` スクリプトで `tsup` が自動実行）。

## サブパッケージ

3 つの独立した層を持ち、各アプリは必要な層だけ import します。

| サブパス | 対象 | 内容（v0.2.0 時点） |
|---|---|---|
| `@ayasono/shared/core` | 全アプリ | `createLogger`（winston ロガー factory）/ `DiscordWebhookTransport` / `errors`（`BaseError` 階層） |
| `@ayasono/shared/discord` | Bot のみ | 空スケルトン（`embed` / `commandLoader` 等は v0.3.0 以降） |
| `@ayasono/shared/api` | API を持つ Bot + web | 空スケルトン（`jwt` / `middlewares` 等は将来の Fastify API 実装時） |

> `prisma` 初期化ヘルパ・`locale`（i18next）セットアップは、saika 固有の結合（i18n キー / 名前空間）が強いため当面は各アプリに残置。複数アプリで真に共通化できる形が見えた段階で `core` への切り出しを再検討する。

## import 例（v0.2.0）

```ts
// core（全アプリ）
import {
  createLogger,
  DiscordWebhookTransport,
  BaseError,
  ValidationError,
} from "@ayasono/shared/core";

// logger はアプリ側で env を wiring して singleton を生成する
const logger = createLogger({
  isDevelopment: process.env.NODE_ENV === "development",
  logLevel: process.env.LOG_LEVEL,
});
```

`@ayasono/shared/discord` / `@ayasono/shared/api` は現状空スケルトン。実コードは将来バージョンで追加する。

## 開発

```bash
pnpm install        # 依存解決 + prepare スクリプトで初回 tsup ビルド
pnpm run build      # tsup → dist/ 生成
pnpm run typecheck  # tsc --noEmit
pnpm run lint       # biome check
```

## バージョニング

セマンティックバージョニング（`v0.1.0`、`v0.2.0`、…）。Git タグで管理。

### v0.1.0

3 サブパッケージの空スケルトン。各 `index.ts` は `export {};` のみ。

### v0.2.0

`core` に汎用インフラ3点を投入: `createLogger`（winston ロガー factory）/ `DiscordWebhookTransport`（appName/title を注入で汎用化）/ `errors`（`BaseError` 階層）。saika からの切り出し（§4）。`discord` / `api` は引き続き空スケルトン。

### v0.2.1

配布を GitHub Release の prebuilt tarball + CI に切替（後に撤回）。

### v0.2.2（現在）

配布方式を **git タグ + コミット済み dist** に変更。理由: pnpm 11.4 が HTTP Release tarball 依存の integrity を lockfile に記録せず `--frozen-lockfile` が失敗したため、integrity が記録される git 依存に戻し、prepare ビルドを避けるため dist をコミットする方式にした。`prepare` スクリプトは廃止（consumer は再ビルドしない）。core の内容は v0.2.0 と同一。

### v0.3.0 以降（予定）

`discord/*`（Embed ビルダー等）や `api/*`（JWT / ミドルウェア）を、複数アプリで共通化できる形が見えた段階で追加する。`prisma` / `locale` の共通化余地もここで再検討。

## ライセンス

MIT
