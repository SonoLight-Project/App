import { defineStore } from "pinia";

export const useAccountStore = defineStore(
    "account",
    () => {
        const userId = ref<string | null>(null);
        const userName = ref<string | null>(null);
        const discordUsername = ref<string | null>(null);
        const githubUsername = ref<string | null>(null);

        const setUser = (
            newUserId: string,
            newUserName: string,
            newDiscordUsername: string,
            newGithubUsername: string
        ) => {
            userId.value = newUserId;
            userName.value = newUserName;
            discordUsername.value = newDiscordUsername;
            githubUsername.value = newGithubUsername;
        };

        const clearUser = () => {
            userId.value = null;
            userName.value = null;
        };

        return {
            userId,
            userName,
            discordUsername,
            githubUsername,
            setUser,
            clearUser,
        };
    },
    {
        persist: true,
    }
);
