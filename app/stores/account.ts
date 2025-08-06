import { defineStore } from "pinia";

export const useAccountStore = defineStore(
    "account",
    () => {
        const userId = ref<string | null>(null);
        const userName = ref<string | null>(null);
        const userRole = ref<number | null>(null);
        const discordUsername = ref<string | null>(null);
        const githubUsername = ref<string | null>(null);
        const mcjpgUsername = ref<string | null>(null);

        const setUser = (
            newUserId: string,
            newUserName: string,
            newRole: number,
            newDiscordUsername: string,
            newGithubUsername: string,
            newMcjpgUsername: string
        ) => {
            userId.value = newUserId;
            userName.value = newUserName;
            userRole.value = newRole;
            discordUsername.value = newDiscordUsername;
            githubUsername.value = newGithubUsername;
            mcjpgUsername.value = newMcjpgUsername;
        };

        const clearUser = () => {
            userId.value = null;
            userName.value = null;
            userRole.value = null;
            discordUsername.value = null;
            githubUsername.value = null;
            mcjpgUsername.value = null;
        };

        return {
            userId,
            userName,
            userRole,
            discordUsername,
            githubUsername,
            mcjpgUsername,
            setUser,
            clearUser,
        };
    },
    {
        persist: true,
    }
);
