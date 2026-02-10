import "vue3-toastify/dist/index.css";
import { ref } from "vue";
import { base_url } from "../constants/config.js";
import { toast } from "vue3-toastify";
import { getCookie } from "../utils/cookie.ts";
import { useLogout } from "@/composables/useLogout.js";
import { indexOf } from "lodash";

/**
 * A composable function for making HTTP requests using fetch.
 * @param {string} url - The API endpoint URL.
 * @param {Object} [options] - Optional fetch options, including headers and body.
 * @returns {object} - Reactive object containing data, error, response, and loading state.
 */
export function useFetch(url, options = {}) {
    const data = ref(null);
    const response = ref(null);
    const error = ref(null);
    const loading = ref(false);
    const except = ["user/authentication/logout"];

    // Set default method
    if (!options.method) {
        options.method = options.body ? "POST" : "GET";
    }

    const fetchOptions = {
        mode: "cors",
        ...options,
        headers: {
            'token': `${getCookie("utn") ?? ""}`,
            ...options.headers
        }
    };

    // Handle body stringification if present
    if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
        fetchOptions.body = JSON.stringify(fetchOptions.body);
        fetchOptions.headers = {
            ...fetchOptions.headers,
            "Content-Type": "application/json", // Only for JSON
        };
    }

    const server = base_url;

    const execute = async () => {
        loading.value = true;
        error.value = null;
        const target = server + url;

        try {
            response.value = await fetch(target, fetchOptions);

            if (!response.value.ok) {
                const errorData = await response.value.json();
                const errorMessage = errorData.message || "An error occurred while fetching data.";

                toast(errorMessage, {
                    theme: "auto",
                    type: "error",
                    dangerouslyHTMLString: true,
                });

                if (errorData.statusCode === 401 && except.indexOf(url) === -1) {
                    useLogout();
                }

                error.value = errorData;
            } else {
                data.value = await response.value.json();
            }
        } catch (err) {
            toast(err.message || "An unexpected error occurred.", {
                theme: "auto",
                type: "error",
                dangerouslyHTMLString: true,
            });
            error.value = { message: err.message };
        } finally {
            loading.value = false;
        }
    };

    // Automatically execute if immediate is not set to false
    if (options.immediate !== false) {
        execute();
    }

    return {
        data,
        error,
        response,
        loading,
        isFetching: loading, // alias for compatibility
        execute
    };
}