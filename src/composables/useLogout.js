// Example of a composable (useLogout.js)
import { useUserStore } from '@/stores/user.js';
import router from "@/router/index.ts";

export function useLogout() {
    const user = useUserStore();
        user.signOut();
        router.push({name:'auth-login'});
}