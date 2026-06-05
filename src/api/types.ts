// @ayasono/shared/api — web ダッシュボード ⇔ Bot(Fastify) API の契約型。
// web と各 Bot が同じ型を import し、片方が変えれば相手で型エラー = 契約違反を検出する。

// ── レスポンス封筒 ───────────────────────────────

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "DISCORD_API_ERROR"
  | "INTERNAL_ERROR";

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

// ── 認証 ─────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  globalName: string | null;
  /** アバターハッシュ（未設定で null） */
  avatar: string | null;
}

// ── Discord リソース ─────────────────────────────

export type Locale = "ja" | "en";

export interface Guild {
  id: string;
  name: string;
  /** アイコン URL（未設定で null） */
  icon: string | null;
  memberCount: number;
  /** Bot が参加済みか */
  botJoined: boolean;
}

export type ChannelType = "text" | "voice" | "category";

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
}

export interface Role {
  id: string;
  name: string;
  /** ロールカラー（HEX、未設定で null） */
  color: string | null;
}

export interface Member {
  id: string;
  name: string;
}

// ── ダッシュボード概要 ───────────────────────────

export interface FeatureStatus {
  key: string;
  state: "enabled" | "disabled" | "unconfigured";
  summary: string;
}

export interface GuildOverview {
  guild: Guild;
  features: FeatureStatus[];
}

// ── 機能別設定 ───────────────────────────────────

export interface AfkSettings {
  enabled: boolean;
  channelId: string | null;
}

export interface GuildConfig {
  locale: Locale;
  errorChannelId: string | null;
}

export interface VacSettings {
  enabled: boolean;
  triggerChannelIds: string[];
}

export interface ActiveVac {
  id: string;
  name: string;
  owner: string;
  createdLabel: string;
}

export interface MemberLogSettings {
  enabled: boolean;
  channelId: string | null;
  joinMessage: string;
  leaveMessage: string;
}

export interface BumpSettings {
  enabled: boolean;
  /** "all" で全チャンネル検知、または特定チャンネルID */
  channelId: string;
  mentionRoleId: string | null;
  mentionUserIds: string[];
}

export interface VcAutoRecruitSettings {
  enabled: boolean;
  channelId: string | null;
  message: string;
  embedEnabled: boolean;
  /** 対象カテゴリID（ルート直下は "TOP"） */
  enabledCategoryIds: string[];
}

export interface ActiveInvite {
  id: string;
  vcName: string;
  channelName: string;
  startedLabel: string;
}

export interface InactiveKickSettings {
  enabled: boolean;
  thresholdDays: number;
  channelId: string | null;
  markerRoleId: string | null;
  weekWarnMessage: string;
  finalWarnMessage: string;
  kickMessage: string;
  whitelistRoleIds: string[];
  whitelistUserIds: string[];
}

export interface UnverifiedKickSettings {
  enabled: boolean;
  verifiedRoleId: string | null;
  graceDays: number;
  warnDays: number;
  notifyChannelId: string | null;
  logChannelId: string | null;
  markerRoleId: string | null;
  dmTemplate: string;
  notifyTemplate: string;
  exemptRoleIds: string[];
}

// ── Embed / パネル ───────────────────────────────

export interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

export interface EmbedData {
  title: string;
  description: string;
  /** HEX カラー（例: "#5865F2"） */
  color: string;
  fields: EmbedField[];
}

export interface StickyMessage {
  channelId: string;
  content: string;
  embed: EmbedData | null;
}

export interface TicketPanel {
  id: string;
  /** チケットチャンネルを作成する親カテゴリ ID（パネルの識別キー） */
  categoryId: string | null;
  /** パネルメッセージを設置するチャンネル ID */
  channelId: string | null;
  staffRoleIds: string[];
  title: string;
  description: string;
  color: string;
  autoDeleteDays: number;
  maxTicketsPerUser: number;
  /** オープン中チケット数（読み取り専用） */
  openCount: number;
}

export type ReactionRoleMode = "toggle" | "one-action" | "exclusive";
export type ButtonStyle = "primary" | "secondary" | "success" | "danger";

export interface ReactionButton {
  id: string;
  label: string;
  emoji: string;
  style: ButtonStyle;
  roleId: string | null;
}

export interface ReactionRolePanel {
  id: string;
  channelId: string | null;
  mode: ReactionRoleMode;
  title: string;
  description: string;
  color: string;
  buttons: ReactionButton[];
}

export interface VcRecruitSetup {
  id: string;
  categoryId: string | null;
  panelChannelId: string | null;
  postChannelId: string | null;
  /** スレッド自動アーカイブ（分）: 60 / 1440 / 4320 / 10080 */
  archiveMinutes: number;
}

export interface VcRecruitSettings {
  enabled: boolean;
  mentionRoleIds: string[];
  setups: VcRecruitSetup[];
}
