# @ayasono/shared

ayasono プロジェクト（saika / hibiki / amane / web）の共通インフラパッケージ。

## 配布方式

各アプリの `package.json` から **git URL + タグ参照** で取り込みます。

```json
{
  "dependencies": {
    "@ayasono/shared": "github:ayasono-project/shared#v0.1.0"
  }
}
```

- **Public**: 内容は汎用インフラコード（ロガー / JWT / Prisma 初期化 等）で機密性ゼロ。Coolify ビルド時の認証セットアップを不要にするため Public で公開。
- **Coolify 対象外**: このリポジトリ自体はデプロイ対象ではありません。各アプリの `pnpm install` 経由でビルドされます（`prepare` スクリプトで `tsup` が自動実行）。

## サブパッケージ

3 つの独立した層を持ち、各アプリは必要な層だけ import します。

| サブパス | 対象 | 内容 |
|---|---|---|
| `@ayasono/shared/core` | 全アプリ | `logger` / `discordWebhookTransport` / `prisma` / `errors` / `locale` |
| `@ayasono/shared/discord` | Bot のみ | `embed` / `commandLoader` / `eventLoader` / `permissions` |
| `@ayasono/shared/api` | API を持つ Bot + web | `jwt` / `middlewares` / `plugins` / `discordOAuth` |

## import 例

```ts
// saika (Bot + API)
import { logger, prisma } from "@ayasono/shared/core";
import { createEmbed } from "@ayasono/shared/discord";
import { authenticate, jwt } from "@ayasono/shared/api";

// hibiki (Bot のみ)
import { logger, prisma } from "@ayasono/shared/core";
import { createEmbed } from "@ayasono/shared/discord";

// web (フロントエンド + 薄い API クライアント)
import { jwt, type JwtPayload } from "@ayasono/shared/api";
```

## 開発

```bash
pnpm install        # 依存解決 + prepare スクリプトで初回 tsup ビルド
pnpm run build      # tsup → dist/ 生成
pnpm run typecheck  # tsc --noEmit
pnpm run lint       # biome check
```

## バージョニング

セマンティックバージョニング（`v0.1.0`、`v0.2.0`、…）。Git タグで管理。

### v0.1.0（現在）

3 サブパッケージの空スケルトン。各 `index.ts` は `export {};` のみ。

### v0.2.0 以降（予定）

saika から `core/*` と `api/*` の実コードを切り出して移行。詳細は `infra/TODO.md` § 1 を参照。

## ライセンス

MIT
