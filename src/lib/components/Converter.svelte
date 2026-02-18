<script lang="ts">
    import { convertChannel, convertRole, convertServer, findIncompatibilies } from "$lib/convert";
    import { ChannelType as DiscordChannelType, type Guild as DiscordGuild, type Channel as DiscordChannel } from "$lib/discord";
    import type { Server as StoatServer, Channel as StoatChannel, Role as StoatRole, Emoji as StoatEmoji } from "$lib/stoat";

    let {
        guild = $bindable(),
        server = $bindable(),
        token,
        isBot,
    }: {
        guild: DiscordGuild,
        server: StoatServer,
        token: string,
        isBot: boolean,
    } = $props();

    let channelMapping: Record<string, StoatChannel> = $state({});
    let roleMapping: Record<string, StoatRole> = $state({});
    let discordCategories: Record<string, DiscordChannel> = $derived.by(() => {
        let categories: Record<string, DiscordChannel> = {};

        for (const channel of guild.channels ?? []) {
            if (channel.type == DiscordChannelType.Category) {
                categories[channel.id] = channel;
            };
        };

        return categories
    });
    let config = $derived({ token, isBot });

    let status: "unset" | "running" | "done" = $state("unset");

    async function convert() {
        if (status != "unset") {
            return
        };

        status = "running";

        for (const role of guild.roles) {
            if (role.id == "0") {
                continue;
            };

            let stoatRole;
            [stoatRole, server] = await convertRole(server, role, config)
            roleMapping[role.id] = stoatRole;
        };

        for (const channel of guild.channels ?? []) {
            if (channel.type == DiscordChannelType.Category) {
                continue;
            };

            channelMapping[channel.id] = await convertChannel(server, discordCategories, roleMapping, channel, config);
        };

        server = await convertServer(server, guild, channelMapping, config);

        status = "done"
    }
</script>

<div>
    {#if status == "unset"}
        <ul>
        {#each findIncompatibilies(server, guild) as warning}
            <li style:color="red">{warning}</li>
        {/each}
        </ul>
    {/if}
    <button onclick={convert}>Convert!</button>
    <div>
        <h2>{server.name}</h2>
        <div>
            <p>Roles:</p>
            <ul>
                {#each Object.values(server.roles ?? []) as role}
                    <li><p>@{role.name}</p></li>
                {/each}
            </ul>
            <p>Channels:</p>
            <ul>
                {#each Object.values(channelMapping) as channel}
                    <li><p>#{channel.name}</p></li>
                {/each}
            </ul>
        </div>
    </div>
</div>