type ApiErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" | "CONFLICT" | "RATE_LIMITED" | "DISCORD_API_ERROR" | "INTERNAL_ERROR";
interface ApiSuccess<T> {
    data: T;
}
interface ApiErrorResponse {
    error: {
        code: ApiErrorCode;
        message: string;
        details?: unknown;
    };
}
interface AuthUser {
    id: string;
    username: string;
    globalName: string | null;
    /** アバターハッシュ（未設定で null） */
    avatar: string | null;
}
type Locale = "ja" | "en";
interface Guild {
    id: string;
    name: string;
    /** アイコン URL（未設定で null） */
    icon: string | null;
    memberCount: number;
    /** Bot が参加済みか */
    botJoined: boolean;
}
type ChannelType = "text" | "voice" | "category";
interface Channel {
    id: string;
    name: string;
    type: ChannelType;
}
interface Role {
    id: string;
    name: string;
    /** ロールカラー（HEX、未設定で null） */
    color: string | null;
}
interface Member {
    id: string;
    name: string;
}
interface FeatureStatus {
    key: string;
    state: "enabled" | "disabled" | "unconfigured";
    summary: string;
}
interface GuildOverview {
    guild: Guild;
    features: FeatureStatus[];
}
interface AfkSettings {
    enabled: boolean;
    channelId: string | null;
}
interface GuildConfig {
    locale: Locale;
    errorChannelId: string | null;
}
interface VacSettings {
    enabled: boolean;
    triggerChannelIds: string[];
}
interface ActiveVac {
    id: string;
    name: string;
    owner: string;
    createdLabel: string;
}
interface MemberLogSettings {
    enabled: boolean;
    channelId: string | null;
    joinMessage: string;
    leaveMessage: string;
}
interface BumpSettings {
    enabled: boolean;
    /** "all" で全チャンネル検知、または特定チャンネルID */
    channelId: string;
    mentionRoleId: string | null;
    mentionUserIds: string[];
}
interface VcAutoRecruitSettings {
    enabled: boolean;
    channelId: string | null;
    message: string;
    embedEnabled: boolean;
    /** 対象カテゴリID（ルート直下は "TOP"） */
    enabledCategoryIds: string[];
}
interface ActiveInvite {
    id: string;
    vcName: string;
    channelName: string;
    startedLabel: string;
}
interface InactiveKickSettings {
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
interface UnverifiedKickSettings {
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
interface EmbedField {
    name: string;
    value: string;
    inline: boolean;
}
interface EmbedData {
    title: string;
    description: string;
    /** HEX カラー（例: "#5865F2"） */
    color: string;
    fields: EmbedField[];
}
interface StickyMessage {
    channelId: string;
    content: string;
    embed: EmbedData | null;
}
interface TicketPanel {
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
type ReactionRoleMode = "toggle" | "one-action" | "exclusive";
type ButtonStyle = "primary" | "secondary" | "success" | "danger";
interface ReactionButton {
    id: string;
    label: string;
    emoji: string;
    style: ButtonStyle;
    roleId: string | null;
}
interface ReactionRolePanel {
    id: string;
    channelId: string | null;
    mode: ReactionRoleMode;
    title: string;
    description: string;
    color: string;
    buttons: ReactionButton[];
}
interface VcRecruitSetup {
    id: string;
    categoryId: string | null;
    panelChannelId: string | null;
    postChannelId: string | null;
    /** スレッド自動アーカイブ（分）: 60 / 1440 / 4320 / 10080 */
    archiveMinutes: number;
}
interface VcRecruitSettings {
    enabled: boolean;
    mentionRoleIds: string[];
    setups: VcRecruitSetup[];
}

export type { ActiveInvite, ActiveVac, AfkSettings, ApiErrorCode, ApiErrorResponse, ApiSuccess, AuthUser, BumpSettings, ButtonStyle, Channel, ChannelType, EmbedData, EmbedField, FeatureStatus, Guild, GuildConfig, GuildOverview, InactiveKickSettings, Locale, Member, MemberLogSettings, ReactionButton, ReactionRoleMode, ReactionRolePanel, Role, StickyMessage, TicketPanel, UnverifiedKickSettings, VacSettings, VcAutoRecruitSettings, VcRecruitSettings, VcRecruitSetup };
