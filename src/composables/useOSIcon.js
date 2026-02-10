import { ref } from 'vue';

/**
 * Composable to get the flag URL for a given os code.
 */
export function useOSFlag() {
    const osIcon = ref(null);
    const error = ref(null);

    /**
     * Fetch the flag URL for the given os code.
     * @param {String} osCode - The os code (e.g., 'us', 'fr').
     */
    const getOSLogo = (osCode) => {
        try {
            if (!osCode) throw new Error('OS code is required');

            // Assuming flags are in `public/assets/flags/`
            osIcon.value = `/image/icons/os/${osCode.toLowerCase()}.svg`;
            error.value = null;
        } catch (err) {
            error.value = `Error loading flag for ${osCode}: ${err.message}`;
            osIcon.value = null;
        }
    };

    return { osIcon, error, getOSLogo };
}
