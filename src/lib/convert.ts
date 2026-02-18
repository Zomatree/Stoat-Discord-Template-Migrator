import { isNotNullish } from "$lib";
import {
    type Role as DiscordRole,
    type Channel as DiscordChannel,
    type Guild as DiscordGuild,
    type Emoji as DiscordEmoji,
    ChannelType as DiscordChannelType,
    OverwriteType as DiscordOverwriteType,
    fetchBanner,
    fetchEmoji,
    ChannelType,
} from "./discord";
import {
    type Role as StoatRole,
    type Channel as StoatChannel,
    type Server as StoatServer,
    type Category as StoatCategory,
    type Emoji as StoatEmoji,
    type DataEditServer,
    createRole,
    editRole,
    createChannel,
    setDefaultChannelPermissions,
    setRoleChannelPermissions,
    editServer,
    uploadFile,
    setRoleServerPermissions,
    setDefaultServerPermissions,
    type Config,
} from "./stoat";

const PERM_MAP: [bigint, number][] = [
    [BigInt(1 << 0), 1 << 25],
    [BigInt(1 << 1), 1 << 6],
    [BigInt(1 << 2), 1 << 7],
    [BigInt(1 << 3), 0x000F_FFFF_FFFF_FFFF],
    [BigInt(1 << 4), 1 << 0],
    [BigInt(1 << 5), 1 << 1],
    [BigInt(1 << 6), 1 << 29],
    // [BigInt(1 << 7), 1 << 0],
    // [BigInt(1 << 8), 1 << 0],
    [BigInt(1 << 9), 1 << 32],
    [BigInt(1 << 10), 1 << 20],
    [BigInt(1 << 11), 1 << 22],
    // [BigInt(1 << 12), 1 << 0],
    [BigInt(1 << 13), 1 << 23],
    [BigInt(1 << 14), 1 << 26],
    [BigInt(1 << 15), 1 << 27],
    [BigInt(1 << 16), 1 << 21],
    [BigInt(1 << 17), 1 << 37],
    // [BigInt(1 << 18), 1 << 0],
    // [BigInt(1 << 19), 1 << 0],
    [BigInt(1 << 20), 1 << 30],
    [BigInt(1 << 21), 1 << 31],
    [BigInt(1 << 22), 1 << 33],
    [BigInt(1 << 23), 1 << 34],
    [BigInt(1 << 24), 1 << 35],
    // [BigInt(1 << 25), 1 << 0],
    [BigInt(1 << 26), 1 << 10 | 1 << 12],
    [BigInt(1 << 27), 1 << 11 | 1 << 13],
    [BigInt(1 << 28), 1 << 9 | 1 << 2 | 1 << 3],
    [BigInt(1 << 29), 1 << 24],
    [BigInt(1 << 30), 1 << 4],
    // [BigInt(1 << 31), 1 << 0],
    // [BigInt(1 << 32), 1 << 0],
    // [BigInt(1 << 33), 1 << 0],
    // [BigInt(1 << 34), 1 << 0],
    // [BigInt(1 << 35), 1 << 0],
    // [BigInt(1 << 36), 1 << 0],
    // [BigInt(1 << 37), 1 << 0],
    // [BigInt(1 << 38), 1 << 0],
    // [BigInt(1 << 39), 1 << 0],
    [BigInt(1 << 40), 1 << 8],
    // [BigInt(1 << 41), 1 << 0],
    // [BigInt(1 << 42), 1 << 0],
    // [BigInt(1 << 43), 1 << 0],
    // [BigInt(1 << 44), 1 << 0],
    // [BigInt(1 << 45), 1 << 0],
    // [BigInt(1 << 46), 1 << 0],
    // [BigInt(1 << 49), 1 << 0],
    // [BigInt(1 << 50), 1 << 0],
    // [BigInt(1 << 51), 1 << 23],
    // [BigInt(1 << 52), 1 << 0],
];

export function convertPermission(permission: string): number {
    const value = BigInt(permission);

    let output = 0;

    for (const [discordPerm, stoatPerm] of PERM_MAP) {
        if ((value & discordPerm) == discordPerm) {
            output |= stoatPerm;
        }
    }

    return output;
}

export async function convertRole(
    server: StoatServer,
    discordRole: DiscordRole,
    config: Config,
): Promise<[StoatRole, StoatServer]> {
    let data_create = {
        name: discordRole.name,
    };

    let stoatRole = await createRole(server._id, data_create, config);

    let dataEdit = {
        hoist: discordRole.hoist,
        colour:
            discordRole.colors.primary_color != 0
                ? "#" + discordRole.colors.primary_color.toString(16)
                : null,
    };

    let allow = convertPermission(discordRole.permissions);

    await editRole(server._id, stoatRole._id, dataEdit, config);

    let newServer = await setRoleServerPermissions(
        server._id,
        stoatRole._id,
        { allow, deny: 0 },
        config,
    );

    return [newServer.roles![stoatRole._id], newServer];
}

export async function convertChannel(
    server: StoatServer,
    discordCategories: Record<string, DiscordChannel>,
    roleMapping: Record<string, StoatRole>,
    discordChannel: DiscordChannel,
    config: Config,
): Promise<StoatChannel> {
    let data = {
        name: discordChannel.name,
        description: discordChannel.topic,
        nsfw: discordChannel.nsfw,
        voice:
            discordChannel.type == DiscordChannelType.Voice ||
            discordChannel.type == DiscordChannelType.StageVoice
                ? { max_users: discordChannel.user_limit }
                : null,
    };

    let stoatChannel = await createChannel(server._id, data, config);

    let categoryPerms = isNotNullish(discordChannel.parent_id) ? discordCategories[discordChannel.parent_id].permission_overwrites ?? [] : null

    for (let overwrite of discordChannel.permission_overwrites ?? []) {
        if (overwrite.type == DiscordOverwriteType.Member) {
            continue;
        }

        let allow = convertPermission(overwrite.allow);
        let deny = convertPermission(overwrite.deny);

        let categoryRolePerms = categoryPerms?.find(p => p.id == overwrite.id);

        if (categoryRolePerms) {
            allow |= convertPermission(categoryRolePerms.allow);
            deny |= convertPermission(categoryRolePerms.deny);
        }

        if (overwrite.id == "0") {
            stoatChannel = await setDefaultChannelPermissions(
                stoatChannel._id,
                { allow, deny },
                config,
            );
        } else {
            let role = roleMapping[overwrite.id];

            stoatChannel = await setRoleChannelPermissions(
                stoatChannel._id,
                role._id,
                { allow, deny },
                config,
            );
        }
    }

    return stoatChannel;
}

// export async function convertEmoji(
//     server: StoatServer,
//     emoji: DiscordEmoji,
//     config: string,
// ): Promise<StoatEmoji> {
//     let blob = await fetchEmoji(emoji.id);
//     let id = await uploadFile("emojis", blob, config);
//     return await createEmoji(server._id, id, emoji.name, config);
// }

export async function convertServer(
    server: StoatServer,
    guild: DiscordGuild,
    channelMapping: Record<string, StoatChannel>,
    config: Config,
): Promise<StoatServer> {
    let categories: StoatCategory[] = [];

    for (const channel of guild.channels ?? []) {
        if (channel.type == DiscordChannelType.Category) {
            categories.push({
                id: String(channel.id),
                title: channel.name,
                channels: guild.channels!
                    .filter((c) => c.parent_id == channel.id)
                    .sort((a, b) => a.position - b.position)
                    .map((c) => channelMapping[c.id]._id),
            });
        }
    }

    let banner = null;

    if (typeof guild.banner == "string") {
        let blob = await fetchBanner(guild.id, guild.banner);
        banner = await uploadFile("banners", blob, config);
    }

    let system_channel_id = isNotNullish(guild.system_channel_id) ? channelMapping[guild.system_channel_id]._id : null;

    let dataEdit: DataEditServer = {
        name: guild.name,
        description: guild.description,
        banner,
        categories,
        system_messages:
            system_channel_id != null
                ? {
                    user_joined: system_channel_id,
                    user_left: system_channel_id,
                    user_kicked: system_channel_id,
                    user_banned: system_channel_id,
                }
                : null,
    };

    await editServer(server._id, dataEdit, config);

    let defaultRole = guild.roles.find((r) => r.id == "0")!;
    server = await setDefaultServerPermissions(
        server._id,
        convertPermission(defaultRole.permissions),
        config,
    );

    return server;
}

export function findIncompatibilies(server: StoatServer, guild: DiscordGuild): string[] {
    let warnings = [];

    for (const channel of server.channels) {
        warnings.push(`Stoat server has channel #${channel.name}, it is reconmended to delete this before you continue.`);
    };

    for (const role of Object.values(server.roles ?? [])) {
        warnings.push(`Stoat server has role @${role.name}, it is reconmended to delete this before you continue.`);
    };

    for (const role of guild.roles) {
        if (typeof role.icon == "string") {
            warnings.push(`Role @${role.name} has an icon which is not supported.`);
        };
    };

    for (const channel of guild.channels ?? []) {
        if (!(channel.type in [ChannelType.Category, ChannelType.Text, ChannelType.Voice])) {
            let type: string | null = null;

            switch (channel.type) {
                case ChannelType.Announcement, ChannelType.Forum, ChannelType.Media:
                    type = "text";
                    break;
                case ChannelType.StageVoice:
                    type = "voice";
                    break;
            };

            if (type != null) {
                warnings.push(`Channel #${channel.name} is an unsupported channel type, will be converted to a ${type} channel.`);
            };
        };

        for (const overwrite of channel.permission_overwrites ?? []) {
            if (overwrite.type == DiscordOverwriteType.Member) {
                warnings.push(`Channel ${channel.name} has a permission overwrite for member ${overwrite.id} which is unsupported, will be skipped.`);
            };
        };
    };

    return warnings;
}