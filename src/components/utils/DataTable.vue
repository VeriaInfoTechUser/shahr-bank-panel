<template>
  <div class="data-table-container">
    <!-- Search and Filter Controls -->
    <div class="controls-bar">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          class="search-input"
          :placeholder="t('common.search')"
        />
        <span class="search-icon">🔍</span>
      </div>

      <div v-if="hasFrameworks" class="framework-filter">
        <select v-model="selectedFramework" class="filter-select">
          <option value="">{{ t('common.all_frameworks') }}</option>
          <option v-for="fw in frameworks" :key="fw" :value="fw">
            {{ fw }}
          </option>
        </select>
      </div>

      <div class="view-toggle">
        <button 
          :class="['toggle-btn', { active: viewMode === 'table' }]"
          @click="viewMode = 'table'"
          title="Table view"
        >
          📊
        </button>
        <button 
          :class="['toggle-btn', { active: viewMode === 'card' }]"
          @click="viewMode = 'card'"
          title="Card view"
        >
          📋
        </button>
      </div>
    </div>

    <!-- Desktop Table View -->
    <div v-if="viewMode === 'table'" class="table-wrapper desktop-view">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th 
                v-for="column in columns" 
                :key="column.key"
                class="table-header"
                :class="{ sortable: column.sortable !== false }"
                @click="column.sortable !== false && toggleSort(column.key)"
              >
                <span class="header-content">
                  {{ column.label }}
                  <span v-if="column.sortable !== false" class="sort-indicator">
                    <span v-if="sortKey === column.key" class="active">
                      {{ sortOrder === 'asc' ? '↑' : '↓' }}
                    </span>
                    <span v-else class="inactive">↕</span>
                  </span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in filteredAndSorted" :key="`row-${idx}`" class="table-row">
              <td v-for="column in columns" :key="`${idx}-${column.key}`" class="table-cell">
                <div class="cell-content">
                  {{ getValueByPath(row, column.key) }}
                </div>
              </td>
            </tr>
            <tr v-if="filteredAndSorted.length === 0" class="empty-row">
              <td :colspan="columns.length" class="empty-cell">
                {{ t('common.no_data') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Card View -->
    <div v-if="viewMode === 'card'" class="cards-wrapper mobile-view">
      <div v-if="filteredAndSorted.length > 0" class="cards-grid">
        <div v-for="(row, idx) in filteredAndSorted" :key="`card-${idx}`" class="data-card">
          <div v-for="column in columns" :key="`${idx}-${column.key}`" class="card-field">
            <span class="field-label">{{ column.label }}</span>
            <span class="field-value">{{ getValueByPath(row, column.key) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        {{ t('common.no_data') }}
      </div>
    </div>

    <!-- Pagination Info -->
    <div v-if="filteredAndSorted.length > 0" class="pagination-info">
      {{ filteredAndSorted.length }} {{ t('common.records') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Column {
  key: string
  label: string
  sortable?: boolean
  formatter?: (value: any) => string
}

interface Props {
  columns: Column[]
  data: Record<string, any>[]
  searchableFields?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  searchableFields: () => ['title', 'name', 'answer'],
})

const { t, locale } = useI18n()

// Sorting state
const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Filtering state
const searchQuery = ref('')
const selectedFramework = ref('')
const viewMode = ref<'table' | 'card'>('table')

// Extract unique frameworks from data
const frameworks = computed(() => {
  const fw = new Set<string>()
  props.data.forEach(row => {
    if (row.frameworks && Array.isArray(row.frameworks)) {
      row.frameworks.forEach(f => fw.add(f))
    }
  })
  return Array.from(fw).sort()
})

const hasFrameworks = computed(() => frameworks.value.length > 0)

// Get nested value by path (e.g., "user.name")
const getValueByPath = (obj: Record<string, any>, path: string): any => {
  const keys = path.split('.')
  let value = obj
  for (const key of keys) {
    value = value?.[key]
  }
  return value ?? '-'
}

// Filter data by search and framework
const filteredData = computed(() => {
  return props.data.filter(row => {
    // Framework filter
    if (selectedFramework.value) {
      if (!row.frameworks || !row.frameworks.includes(selectedFramework.value)) {
        return false
      }
    }

    // Search filter
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      return props.searchableFields.some(field => {
        const value = getValueByPath(row, field)
        return value?.toString().toLowerCase().includes(query)
      })
    }

    return true
  })
})

// Sort filtered data
const filteredAndSorted = computed(() => {
  if (!sortKey.value) return filteredData.value

  return [...filteredData.value].sort((a, b) => {
    const aVal = getValueByPath(a, sortKey.value)
    const bVal = getValueByPath(b, sortKey.value)

    // Handle number comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal
    }

    // Handle string comparison
    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    const comparison = aStr.localeCompare(bStr, locale.value)
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
})

// Toggle sort
const toggleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}
</script>

<style scoped lang="scss">
.data-table-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

// Controls Bar
.controls-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
}

.search-box {
  flex: 1;
  min-width: 200px;
  position: relative;
  display: flex;
  align-items: center;

  .search-input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.95rem;
    transition: all 0.3s ease;

    [dir='rtl'] & {
      direction: rtl;
      text-align: right;
      padding: 0.75rem 1rem 0.75rem 2.5rem;
    }

    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  }

  .search-icon {
    position: absolute;
    right: 0.75rem;
    font-size: 1rem;
    pointer-events: none;

    [dir='rtl'] & {
      right: auto;
      left: 0.75rem;
    }
  }
}

.framework-filter {
  .filter-select {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;

    [dir='rtl'] & {
      direction: rtl;
      text-align: right;
    }

    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  }
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  background: #f3f4f6;
  padding: 0.5rem;
  border-radius: 0.5rem;

  .toggle-btn {
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 1.1rem;
    transition: all 0.3s ease;

    &:hover {
      background: white;
    }

    &.active {
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
}

// Table View
.table-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.table-responsive {
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f3f4f6;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;

    &:hover {
      background: #9ca3af;
    }
  }
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  thead {
    background: linear-gradient(90deg, #f9fafb 0%, #f3f4f6 100%);
    position: sticky;
    top: 0;
    z-index: 10;

    .table-header {
      padding: 1rem 0.75rem;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      cursor: default;
      transition: background 0.2s ease;

      [dir='rtl'] & {
        text-align: right;
      }

      &.sortable {
        cursor: pointer;

        &:hover {
          background: rgba(37, 99, 235, 0.05);
        }
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        [dir='rtl'] & {
          flex-direction: row-reverse;
        }

        .sort-indicator {
          font-size: 0.75rem;
          opacity: 0.5;
          transition: opacity 0.2s ease;

          .active {
            opacity: 1;
            color: #2563eb;
          }
        }
      }
    }
  }

  tbody {
    tr {
      transition: background-color 0.2s ease;
      border-bottom: 1px solid #e5e7eb;

      &:hover {
        background-color: #f9fafb;
      }

      &.empty-row {
        text-align: center;

        [dir='rtl'] & {
          text-align: center;
        }

        .empty-cell {
          padding: 2rem 1rem;
          color: #9ca3af;
          font-style: italic;
        }
      }

      .table-cell {
        padding: 0.75rem;
        color: #1f2937;

        .cell-content {
          word-break: break-word;
          max-height: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      }
    }
  }
}

// Card View (Mobile)
.cards-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.data-card {
  padding: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .card-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .field-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #6b7280;
    }

    .field-value {
      font-size: 0.95rem;
      color: #1f2937;
      word-break: break-word;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #9ca3af;
  font-style: italic;
}

// Pagination Info
.pagination-info {
  text-align: center;
  font-size: 0.9rem;
  color: #6b7280;
}

// Responsive
@media (max-width: 768px) {
  .desktop-view {
    display: none;
  }

  .mobile-view {
    display: flex;
  }

  .data-table-container {
    gap: 1rem;
  }
}

@media (min-width: 769px) {
  .mobile-view {
    display: none;
  }
}
</style>
