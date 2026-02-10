import { ref } from 'vue';

/**
 * Composable to get the flag URL for a given country code.
 */
export function useCountryFlag() {
    const flag = ref(null);
    const error = ref(null);

    /**
     * Fetch the flag URL for the given country code.
     * @param {String} countryCode - The country code (e.g., 'us', 'fr').
     */
    const getFlag = (countryCode) => {
        try {
            if (!countryCode) throw new Error('Country code is required');

            // Assuming flags are in `public/assets/flags/`
            flag.value = `/image/icons/flags/${countryCode.toLowerCase()}.svg`;
            error.value = null;
        } catch (err) {
            error.value = `Error loading flag for ${countryCode}: ${err.message}`;
            flag.value = null;
        }
    };

    return { flag, error, getFlag };
}
