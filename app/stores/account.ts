import { defineStore } from "pinia";

export const useAccountStore = defineStore("account", () => {
        const userId = ref<string | null>(null);
        const userName = ref<string | null>(null);

        const setUser = (newUserId: string, newUserName: string) => {
            userId.value = newUserId;
            userName.value = newUserName;
        }

        const clearUser = () => {
            userName.value = null;
            userName.value = null;
        }

        return {
            userId,
            userName,
            setUser,
            clearUser,
        }
    },
    {
        persist: true,
    })
