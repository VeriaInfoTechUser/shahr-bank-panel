import { ref } from 'vue';
import {base_url, uri} from "@/constants/config.js";
import { toast } from "vue3-toastify";
import {getCookie} from "@/utils/cookie.ts";

export function useDownload(file) {
    const loading = ref(false);
    const error = ref(null);

    const handleDownload = async () => {
        loading.value = true;
        error.value = null;

        try {
            const response = await fetch(base_url+uri.api.media.private.stream, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': getCookie('utn')??'',
                },
                body: JSON.stringify({ id: file.id ?? -1 }),
            });

            if (!response.ok) {
                throw new Error('Failed to download file');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${file.type}.${file.extension}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast('File downloaded successfully!', {
                theme: "auto",
                type: "success",
            });
        } catch (err) {
            error.value = err.message;
            toast('An error occurred while downloading the file.', {
                theme: "auto",
                type: "error",
            });
        } finally {
            loading.value = false;
        }
    };

    return { handleDownload, loading, error };
}
