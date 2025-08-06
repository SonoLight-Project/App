import { defineStore } from "pinia";

export const useOAuthStore = defineStore(
    "oauth",
    () => {
        const action = ref<"login" | "bind">("login");
        const in_operation = ref<boolean>(false);

        const setAction = (newAction: "login" | "bind") => {
            action.value = newAction;
        };

        const setOperation = (newOperation: boolean) => {
            in_operation.value = newOperation;
        };

        return {
            action,
            in_operation,
            setAction,
            setOperation,
        };
    },
    {
        persist: true,
    }
);
