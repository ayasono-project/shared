// winston → Discord Webhook 通知のカスタムトランスポート（汎用）

import TransportStream from "winston-transport";

// Discord Embed の description 文字数上限（Discord API の制限に準拠）
const DISCORD_EMBED_DESCRIPTION_MAX_LENGTH = 4096;

// Discord Embed カラーコード（エラー通知用・赤）
const DISCORD_EMBED_COLOR_ERROR = 0xe74c3c;

/** DiscordWebhookTransport のオプション */
export type DiscordWebhookTransportOptions = {
  /**
   * Embed タイトルを送信時に解決するコールバック。
   * i18n やアプリ名の解決はアプリ側に委ね、shared はロケール非依存に保つ。
   * 送信時（log 呼び出し時）に評価されるため、起動直後の i18n 未初期化状態を回避できる。
   */
  getTitle: () => string;
};

/**
 * Winston から Discord Webhook へ error レベルのログを Embed 形式で送信するカスタムトランスポート。
 * 送信失敗はアプリの動作を阻害しないよう stderr へ記録するのみで上位へは伝播させない。
 */
export class DiscordWebhookTransport extends TransportStream {
  private readonly webhookUrl: string;
  private readonly getTitle: () => string;

  constructor(webhookUrl: string, options: DiscordWebhookTransportOptions) {
    // error レベルのみ受信するよう level を固定する
    super({ level: "error" });
    this.webhookUrl = webhookUrl;
    this.getTitle = options.getTitle;
  }

  /**
   * ログイベントを受け取り Discord Webhook へ Embed 形式で送信する。
   */
  log(info: Record<string, unknown>, callback: () => void): void {
    // 非同期で "logged" イベントを発行（Winston トランスポートの規約）
    setImmediate(() => this.emit("logged", info));

    const description = this.buildDescription(info);
    const payload = {
      embeds: [
        {
          // タイトルは送信時に解決（i18n はアプリ側に委譲）
          title: this.getTitle(),
          description,
          color: DISCORD_EMBED_COLOR_ERROR,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // Webhook 送信は非同期で実施し、失敗してもコールバックは即座に呼び出す
    fetch(this.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((err: unknown) => {
      // 送信失敗はアプリを止めず stderr のみに記録する
      process.stderr.write(
        `[DiscordWebhookTransport] Failed to send webhook: ${String(err)}\n`,
      );
    });

    callback();
  }

  /**
   * Discord Embed の description 文字列を組み立てる。
   * message と stack を連結し、Discord の制限を超える場合は末尾をトリミングする。
   */
  private buildDescription(info: Record<string, unknown>): string {
    const message =
      typeof info.message === "string"
        ? info.message
        : String(info.message ?? "");
    const stack = typeof info.stack === "string" ? info.stack : undefined;
    const stackStr = stack ? `\n\`\`\`\n${stack}\n\`\`\`` : "";
    const full = `**${message}**${stackStr}`;
    if (full.length <= DISCORD_EMBED_DESCRIPTION_MAX_LENGTH) {
      return full;
    }
    // 上限を超える場合は末尾を "..." に置き換えてトリミング
    return full.slice(0, DISCORD_EMBED_DESCRIPTION_MAX_LENGTH - 3) + "...";
  }
}
