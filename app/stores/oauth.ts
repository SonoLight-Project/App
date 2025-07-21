import { defineStore } from "pinia";

export const useOAuthStore = defineStore("oauth", () => {
    const state = ref<string | null>(null);
    const action = ref<'login' | 'bind'>('login');

    const setState = (newState: string) => {
        state.value = newState;
    };

    const setAction = (newAction: 'login' | 'bind') => {
        action.value = newAction;
    };

    const clearState = () => {
        state.value = null;
    };

    return {
        state,
        action,
        setState,
        setAction,
        clearState,
    };
});
