import { defineStore } from "pinia";

export const useOAuthStore = defineStore(
    "oauth",
    () => {
        const action = ref<"login" | "bind">("login");

        const setAction = (newAction: "login" | "bind") => {
            action.value = newAction;
        };

        return {
            action,
            setAction,
        };
    },
    {
        persist: true,
    }
);
