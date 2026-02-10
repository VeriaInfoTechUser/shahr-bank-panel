import { ref } from 'vue';
import { object, string } from 'yup';
import VObjects from '@/constants/vObjects.js';

// Cache for validation schemas
const schemaCache = new Map();

/**
 * Composable for validation with cache strategy
 * @param {Array<string>} keys - Array of validation rule keys
 * @returns {object} Yup validation schema object
 */
export function useValidationCache(keys) {
    // Create cache key from sorted keys array
    const cacheKey = keys.sort().join(',');
    
    // Check if schema exists in cache
    if (schemaCache.has(cacheKey)) {
        return schemaCache.get(cacheKey);
    }
    
    // Build schema from keys
    const selectedSchemaFields = {};
    keys.forEach(key => {
        if (VObjects[key]) {
            selectedSchemaFields[key] = VObjects[key];
        }
    });
    
    // Create schema object
    const schema = object(selectedSchemaFields);
    
    // Store in cache
    schemaCache.set(cacheKey, schema);
    
    return schema;
}

/**
 * Get validation rule for a specific field
 * @param {string} key - Validation rule key
 * @returns {object|null} Yup validation rule or null
 */
export function getValidationRule(key) {
    return VObjects[key] || null;
}

/**
 * Clear validation cache (useful for testing or reset)
 */
export function clearValidationCache() {
    schemaCache.clear();
}


