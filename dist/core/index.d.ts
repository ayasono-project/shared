import TransportStream from 'winston-transport';
import winston from 'winston';

/** DiscordWebhookTransport のオプション */
type DiscordWebhookTransportOptions = {
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
declare class DiscordWebhookTransport extends TransportStream {
    private readonly webhookUrl;
    private readonly getTitle;
    constructor(webhookUrl: string, options: DiscordWebhookTransportOptions);
    /**
     * ログイベントを受け取り Discord Webhook へ Embed 形式で送信する。
     */
    log(info: Record<string, unknown>, callback: () => void): void;
    /**
     * Discord Embed の description 文字列を組み立てる。
     * message と stack を連結し、Discord の制限を超える場合は末尾をトリミングする。
     */
    private buildDescription;
}

/**
 * ベースエラークラス
 */
declare class BaseError extends Error {
    readonly name: string;
    readonly isOperational: boolean;
    readonly statusCode?: number;
    readonly embedTitle?: string;
    /**
     * 遅延翻訳用の i18n キー
     * 設定されている場合、interactionErrorHandler が interaction.locale で翻訳する
     */
    messageKey?: string;
    /** 遅延翻訳用の補間パラメータ */
    messageParams?: Record<string, unknown>;
    constructor(name: string, message: string, isOperational?: boolean, statusCode?: number, embedTitle?: string);
}
/**
 * バリデーションエラー
 */
declare class ValidationError extends BaseError {
    constructor(message: string, embedTitle?: string);
    /**
     * 翻訳キーから ValidationError を生成する（遅延翻訳パターン）
     * interactionErrorHandler が interaction.locale で翻訳するため、
     * throw 時点で言語が固定されない
     * @param messageKey i18n 翻訳キー
     * @param messageParams 補間パラメータ
     * @param embedTitle Embed タイトル上書き
     * @returns 遅延翻訳用の ValidationError
     */
    static fromKey(messageKey: string, messageParams?: Record<string, unknown>, embedTitle?: string): ValidationError;
}
/**
 * 設定エラー
 */
declare class ConfigurationError extends BaseError {
    constructor(message: string, embedTitle?: string);
}
/**
 * データベースエラー
 */
declare class DatabaseError extends BaseError {
    constructor(message: string, isOperational?: boolean, embedTitle?: string);
}
/**
 * Discord APIエラー
 */
declare class DiscordApiError extends BaseError {
    constructor(message: string, statusCode?: number, embedTitle?: string);
}
/**
 * 権限エラー
 */
declare class PermissionError extends BaseError {
    constructor(message: string, embedTitle?: string);
}
/**
 * リソース未検出エラー
 */
declare class NotFoundError extends BaseError {
    constructor(resource: string, embedTitle?: string);
}
/**
 * タイムアウトエラー
 */
declare class TimeoutError extends BaseError {
    constructor(message: string, embedTitle?: string);
}
/**
 * レート制限エラー
 */
declare class RateLimitError extends BaseError {
    constructor(message: string, embedTitle?: string);
}

/** createLogger のオプション */
type CreateLoggerOptions = {
    /** 開発環境フラグ（コンソール出力の粒度を切り替える） */
    isDevelopment: boolean;
    /** 全体のログレベル（未指定時は info） */
    logLevel?: string | undefined;
    /** ログファイル出力ディレクトリ（既定: "logs"） */
    logDir?: string | undefined;
    /** 追加トランスポート（例: Discord Webhook 通知） */
    extraTransports?: winston.transport[] | undefined;
};
/**
 * winston ロガーを生成する。
 * 開発環境では詳細レベルのコンソール、本番では info コンソール（docker logs 向け）を出力し、
 * app / error の日次ローテーションファイルを常時出力する。
 * Discord Webhook 通知などアプリ固有のトランスポートは extraTransports で注入する。
 */
declare function createLogger(options: CreateLoggerOptions): winston.Logger;

export { BaseError, ConfigurationError, type CreateLoggerOptions, DatabaseError, DiscordApiError, DiscordWebhookTransport, type DiscordWebhookTransportOptions, NotFoundError, PermissionError, RateLimitError, TimeoutError, ValidationError, createLogger };
