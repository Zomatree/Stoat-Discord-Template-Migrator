<script lang="ts">
  import Converter from "$lib/components/Converter.svelte";
    import { fetchGuildTemplate, type GuildTemplate } from "$lib/discord";
    import { fetchServer, type Server as StoatServer } from "$lib/stoat";

    let template_code = $state("");
    let token = $state("");
    let server_id = $state("");
    let isBot = $state(false);

    let error: string | null = $state(null);
    let template: GuildTemplate | null = $state(null);
    let server: StoatServer | null = $state(null);

    async function start() {
        if (template_code == "") {
            error = "No template given";
            return;
        };

        let code = template_code;

        try {
            let url = new URL(template_code);

            let pathSegments = url.pathname.split("/");
            code = pathSegments[pathSegments.length - 1];
        } catch {
            console.debug("input not url, trying as raw code");
        };

        try {
            template = await fetchGuildTemplate(code);
        } catch (e) {
            error = String(e);
            return;
        };

        try {
            server = await fetchServer(server_id, { token, isBot });
        } catch (e) {
            error = String(e)
            return;
        };

        error = null;
    };
</script>


<h1>Discord Template Stoat Migrator</h1>
<div>
    {#if template != null && server != null}
        <div>
            <Converter guild={template.serialized_source_guild} server={server} token={token} isBot={isBot}/>
        </div>
    {:else}
        <div>
            <div>
                <p>Discord Template:</p>
                <input bind:value={template_code}>
            </div>
            <div>
                <p>Stoat Token:</p>
                <input bind:value={token}>
            </div>
            <div>
                <span>Is bot token:</span>
                <input type="checkbox" bind:checked={isBot}>
            </div>
            <div>
                <p>Stoat Server ID:</p>
                <input bind:value={server_id}>
            </div>
            <button onclick={start}>Start!</button>
            {#if error != null}
                <p>{error}</p>
            {/if}
        </div>
    {/if}
</div>
