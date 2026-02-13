export type GuildTemplate = {
    code: string,
    name: string,
    description?: string,
    usage_count: string,
    creator_id: string,
    creator: User,
    created_at: string,
    updated_at: string,
    source_guild_id: string,
    serialized_source_guild: Guild,
    is_dirty?: boolean,
};

export type User = {
    id: string,
    username: string,
    global_name: string | null,
    avatar: string | null,
};

export type RoleColor = {
    primary_color: number,
    secondary_color: number | null,
    tertiary_color: number | null,
};

export type Role = {
    id: string,
    name: string,
    colors: RoleColor,
    hoist: boolean,
    icon?: string | null,
    position: number,
    permissions: string,
    mentionable: boolean,
};

export type Emoji = {
    id: string,
    name: string
};

export enum OverwriteType {
    Role = 0,
    Member = 1,
};

export type Overwrite = {
    id: string,
    type: OverwriteType,
    allow: string,
    deny: string,
};

export enum ChannelType {
    Text = 0,
    DM = 1,
    Voice = 2,
    Group = 3,
    Category = 4,
    Announcement = 5,
    AnnouncementThread = 10,
    PublicThread = 11,
    PrivateThread = 12,
    StageVoice = 13,
    Directory = 14,
    Forum = 15,
    Media = 16,
};

export type Channel = {
    id: string,
    type: ChannelType,
    position: number,
    permission_overwrites?: Overwrite[],
    name: string,
    topic?: string | null,
    nsfw?: boolean,
    user_limit?: number,
    parent_id?: string | null,

};

export type Guild = {
    id: string,
    name: string,
    banner?: string | null,
    roles: Role[],
    emojis?: Emoji[],
    channels?: Channel[],
    system_channel_id?: string | null,
    description?: string | null,
};

export function fetchGuildTemplate(code: string): Promise<GuildTemplate> {
    return fetch(`https://discord.com/api/v10/guilds/templates/${code}`)
        .then(resp => resp.json())
}

export function fetchBanner(guild_id: string, hash: string): Promise<Blob> {
    return fetch(`https://cdn.discordapp.com/banners/${guild_id}/${hash}.png`)
        .then(resp => resp.blob())
}

export function fetchEmoji(emoji_id: string): Promise<Blob> {
    return fetch(`https://cdn.discordapp.com/emojis/${emoji_id}.webp`)
        .then(resp => resp.blob())
}