export type DataCreateChannel = {
    name?: string,
    description?: string | null,
    nsfw?: boolean | null,
    voice?: VoiceInformation | null,
};

export type DataCreateRole = {
    name: string,
};

export type VoiceInformation = {
    max_users?: number
};

export type File = {

};

export type OverrideField = { a: number, d: number };
export type Override = { allow: number, deny: number };

export type Channel = {
    _id: string,
    name: string,
    server: string,
    description?: string,
    icon?: File,
    default_permissions?: OverrideField,
    role_permissions?: Record<string, OverrideField>,
    nsfw?: boolean,
    voice?: VoiceInformation,
};

export type Role = {
    _id: string,
    name: string,
    permissions: OverrideField,
    colour?: string,
    hoist?: boolean,
    rank: number,
};

export type EmojiParent = { type: "Detached" } | { type: "Server", id: string };

export type Emoji = {
    _id: string,
    parent: EmojiParent,
    creator_id: string,
    name: string,
    animated?: boolean,
    nsfw?: boolean,
}

export type Category = {
    id: string,
    title: string,
    channels: string[],
};

export type SystemMessageChannels = {
    user_joined?: string,
    user_left?: string,
    user_kicked?: string,
    user_banned?: string,
}

export type Server = {
    _id: string,
    owner: string,
    name: string,
    description?: string,
    channels: Channel[],
    categories?: Category[],
    system_messages?: SystemMessageChannels,
    roles?: Record<string, Role>,
    default_permissions: number,
    icon?: File,
    banner?: File,
}

export type DataEditRole = {
    name?: string | null,
    colour?: string | null,
    hoist?: boolean | null,
}

export type DataEditServer = {
    name?: string | null,
    description?: string | null,
    icon?: string | null,
    banner?: string | null,
    categories?: Category[] | null,
    system_messages?: SystemMessageChannels | null,
}

const BASE_URL = "https://api.stoat.chat"
// const BASE_URL = "http://localhost:14702"
const AUTUMN_BASE_URL = "https://cdn.stoatusercontent.com"

async function handleRatelimit(resp: Response): Promise<Response> {
    console.log(resp.headers);
    let rlRemaining = resp.headers.get("X-Ratelimit-Remaining");
    console.log(rlRemaining, resp.headers.get("X-Ratelimit-Reset-After"));

    if (rlRemaining == "0") {
        let resetAfter = Number(resp.headers.get("X-Ratelimit-Reset-After"));
        await new Promise(r => setTimeout(r, resetAfter));
    };

    return resp
}

export async function createChannel(server_id: string, data: DataCreateChannel, token: string): Promise<Channel> {
    return fetch(`${BASE_URL}/servers/${server_id}/channels`, {
        method: "POST",
        headers: {
            "x-session-token": token,
            "content-type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(handleRatelimit)
    .then(resp => resp.json())
};

export async function createRole(server_id: string, data: DataCreateRole, token: string): Promise<Role> {
    return fetch(`${BASE_URL}/servers/${server_id}/roles`, {
        method: "POST",
        headers: {
            "x-session-token": token,
            "content-type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(handleRatelimit)
    .then(resp => resp.json())
    .then(data => data["role"])
}

export async function uploadFile(tag: string, data: Blob, token: string): Promise<string> {
    let form = new FormData();
    form.set("file", data);

    return fetch(`${AUTUMN_BASE_URL}/${tag}`, {
        method: "POST",
        headers: {
            "x-session-token": token,
        },
        body: form
    })
    .then(handleRatelimit)
    .then(resp => resp.json())
    .then(data => data["id"])
}

// export async function createEmoji(server_id: string, id: string, name: string, token: string): Promise<Emoji> {
//     return fetch(`${BASE_URL}/custom/${id}`, {
//         method: "POST",
//         headers: {
//             "x-session-token": token,
//             "content-type": "application/json"
//         },
//         body: JSON.stringify({
//             name,
//             parent: { type: "Server", id: server_id }
//         })
//     })
//     .then(handleRatelimit)
//     .then(resp => resp.json())
//     .then(data => data["role"])
// }

export async function setDefaultServerPermissions(server_id: string, permissions: number, token: string): Promise<Server> {
    return fetch(`${BASE_URL}/servers/${server_id}/permissions/default`, {
        method: "PUT",
        headers: {
            "x-session-token": token,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            permissions
        })
    })
    .then(handleRatelimit)
    .then(resp => resp.json())
}

export async function setRoleServerPermissions(server_id: string, role_id: string, permissions: Override, token: string): Promise<Server> {
    return fetch(`${BASE_URL}/servers/${server_id}/permissions/${role_id}`, {
        method: "PUT",
        headers: {
            "x-session-token": token,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            permissions
        })
    })
    .then(handleRatelimit)
    .then(resp => resp.json())
}

export async function editRoleRanks(server_id: string, ranks: string[], token: string): Promise<Server> {
    return fetch(`${BASE_URL}/servers/${server_id}/roles/ranks`, {
        method: "PATCH",
        headers: {
            "x-session-token": token,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            ranks
        })
    })
    .then(handleRatelimit)
    .then(resp => resp.json())
}

export async function editRole(server_id: string, role_id: string, data: DataEditRole, token: string): Promise<Server> {
    return fetch(`${BASE_URL}/servers/${server_id}/roles/${role_id}`, {
        method: "PATCH",
        headers: {
            "x-session-token": token,
            "content-type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(handleRatelimit)
    .then(resp => resp.json())
}

export async function editServer(server_id: string, data: DataEditServer, token: string): Promise<Server> {
    return fetch(`${BASE_URL}/servers/${server_id}`, {
        method: "PATCH",
        headers: {
            "x-session-token": token,
            "content-type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(handleRatelimit)
    .then(resp => resp.json())
}

export async function setDefaultChannelPermissions(channel_id: string, permissions: Override, token: string): Promise<Channel> {
    return fetch(`${BASE_URL}/channels/${channel_id}/permissions/default`, {
        method: "PUT",
        headers: {
            "x-session-token": token,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            permissions
        })
    })
    .then(handleRatelimit)
    .then(resp => resp.json())
}

export async function setRoleChannelPermissions(channel_id: string, role_id: string, permissions: Override, token: string): Promise<Channel> {
    return fetch(`${BASE_URL}/channels/${channel_id}/permissions/${role_id}`, {
        method: "PUT",
        headers: {
            "x-session-token": token,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            permissions
        })
    })
    .then(handleRatelimit)
    .then(resp => resp.json())
}

export async function fetchServer(server_id: string, token: string): Promise<Server> {
    return fetch(`${BASE_URL}/servers/${server_id}?include_channels=true`, {
        headers: {
            "x-session-token": token,
        },
    })
    .then(handleRatelimit)
    .then(resp => resp.json())
}