<script setup>
import { computed, ref } from 'vue';
import { useFetch } from "@/composables/useFetch.js";
import { uri } from "@/constants/config.js";
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { debounce } from 'lodash-es';

const { t } = useI18n();
const router = useRouter();

// Admin-specific states
const selectedProducts = ref([]);
const bulkAction = ref('');
const showFilters = ref(false);
const statusFilter = ref('all');
const stockFilter = ref('all');

// View mode state (grid/table)
const viewMode = ref('table'); // Default to table for admin
// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(10);
const availableItemsPerPage = [10, 25, 50, 100];
// Search state
const searchQuery = ref('');
const debouncedSearch = ref('');

// Debounce search input
const debounceSearch = debounce(() => {
  debouncedSearch.value = searchQuery.value;
  currentPage.value = 1;
}, 500);

const { data: products, error, isFetching, execute: refreshProducts } = useFetch(`${uri.admin.product.list}`, {
  body: { type: 'product',limit:1000}
});

// Safely access the product list
const productList = computed(() => {
  const list = products.value?.data?.list || [];

  // Apply search filter
  if (debouncedSearch.value) {
    const query = debouncedSearch.value.toLowerCase();
    return list.filter(product =>
        product.title.toLowerCase().includes(query) ||
        (product.meta.find(m => m.meta_key === 'brand')?.meta_information?.title.toLowerCase().includes(query) ||
            product.meta.some(m => m.meta_value?.toString().toLowerCase().includes(query))
        )
        );
  }

  // Apply status filter
  if (statusFilter.value !== 'all') {
    return list.filter(product => product.status === statusFilter.value);
  }

  // Apply stock filter
  if (stockFilter.value !== 'all') {
    return list.filter(product => {
      const stockMeta = product.meta.find(m => m.meta_key === 'stock');
      if (!stockMeta) return false;
      return stockFilter.value === 'in_stock'
          ? parseInt(stockMeta.meta_value) > 0
          : parseInt(stockMeta.meta_value) <= 0;
    });
  }

  return list;
});

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(productList.value.length / itemsPerPage.value);
});

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return productList.value.slice(start, end);
});

// Toggle select all products
const toggleSelectAll = (event) => {
  if (event.target.checked) {
    selectedProducts.value = paginatedProducts.value.map(product => product.id);
  } else {
    selectedProducts.value = [];
  }
};

// Execute bulk action
const executeBulkAction = async () => {
  if (!bulkAction.value || selectedProducts.value.length === 0) return;

  try {
    // Here you would typically call your API to perform the bulk action
    console.log(`Performing ${bulkAction.value} on`, selectedProducts.value);

    // Refresh the product list after action
    await refreshProducts();
    selectedProducts.value = [];
    bulkAction.value = '';

    // Show success message
    alert(t('admin.bulkActionSuccess'));
  } catch (err) {
    console.error('Bulk action failed:', err);
    alert(t('admin.bulkActionError'));
  }
};

// Change items per page
const changeItemsPerPage = (value) => {
  itemsPerPage.value = value;
  currentPage.value = 1;
  // refreshProducts()
};
// Change  page
const goToPage = (value) => {
  currentPage.value = value;
  // refreshProducts()
};
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- Admin header with actions -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white">
          {{ t('admin.products.title') }}
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('admin.products.manageYourProducts') }}
        </p>
      </div>

      <div class="flex gap-2">
        <button
            @click="router.push({ name: 'app-product-create' })"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {{ t('admin.products.addNew') }}
        </button>
      </div>
    </div>

    <!-- Admin controls bar -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- Bulk actions -->
        <div class="flex items-center gap-2 w-full md:w-auto">
<!--          <select-->
<!--              v-model="bulkAction"-->
<!--              class="block w-full md:w-40 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800"-->
<!--          >-->
<!--            <option value="">{{ t('admin.bulkActions') }}</option>-->
<!--            <option value="publish">{{ t('admin.publish') }}</option>-->
<!--            <option value="unpublish">{{ t('admin.unpublish') }}</option>-->
<!--            <option value="delete">{{ t('admin.delete') }}</option>-->
<!--          </select>-->
<!--          <button-->
<!--              @click="executeBulkAction"-->
<!--              :disabled="!bulkAction || selectedProducts.length === 0"-->
<!--              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"-->
<!--          >-->
<!--            {{ t('admin.apply') }}-->
<!--          </button>-->
        </div>

        <!-- Search and filters -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
<!--          <button-->
<!--              @click="showFilters = !showFilters"-->
<!--              class="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"-->
<!--          >-->
<!--            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">-->
<!--              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />-->
<!--            </svg>-->
<!--            {{ t('admin.filters') }}-->
<!--          </button>-->

          <div class="relative w-full sm:w-64">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
                v-model="searchQuery"
                @input="debounceSearch"
                type="text"
                :placeholder="t('admin.searchProducts')"
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <!-- Expanded filters -->
<!--      <div v-if="showFilters" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">-->
<!--        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">-->
<!--          <div>-->
<!--            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">-->
<!--              {{ t('admin.status') }}-->
<!--            </label>-->
<!--            <select-->
<!--                v-model="statusFilter"-->
<!--                class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800"-->
<!--            >-->
<!--              <option value="all">{{ t('admin.allStatuses') }}</option>-->
<!--              <option value="published">{{ t('admin.published') }}</option>-->
<!--              <option value="draft">{{ t('admin.draft') }}</option>-->
<!--              <option value="archived">{{ t('admin.archived') }}</option>-->
<!--            </select>-->
<!--          </div>-->

<!--          <div>-->
<!--            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">-->
<!--              {{ t('admin.stockStatus') }}-->
<!--            </label>-->
<!--            <select-->
<!--                v-model="stockFilter"-->
<!--                class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800"-->
<!--            >-->
<!--              <option value="all">{{ t('admin.allStockStatuses') }}</option>-->
<!--              <option value="in_stock">{{ t('admin.inStock') }}</option>-->
<!--              <option value="out_of_stock">{{ t('admin.outOfStock') }}</option>-->
<!--            </select>-->
<!--          </div>-->

<!--          <div class="flex items-end">-->
<!--            <button-->
<!--                @click="showFilters = false; statusFilter = 'all'; stockFilter = 'all'"-->
<!--                class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"-->
<!--            >-->
<!--              {{ t('admin.clearFilters') }}-->
<!--            </button>-->
<!--          </div>-->
<!--        </div>-->
<!--      </div>-->
    </div>

    <!-- Results count -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        {{ t('pagination.showing') }}
        <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
        {{ t('pagination.to') }}
        <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, productList.length) }}</span>
        {{ t('pagination.of') }}
        <span class="font-medium">{{ productList.length }}</span>
        {{ t('pagination.products') }}
      </div>

      <div class="flex items-center gap-2">
        <label for="itemsPerPage" class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('pagination.itemsPerPage') }}:
        </label>
        <select
            id="itemsPerPage"
            v-model="itemsPerPage"
            @change="changeItemsPerPage(itemsPerPage)"
            class="block pl-3 pr-8 py-1 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800"
        >
          <option v-for="option in availableItemsPerPage" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isFetching" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">{{ t('error') }}!</strong>
      <span class="block sm:inline">{{ error.message || t('admin.products.loadError') }}</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="productList.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-white">{{ t('admin.products.noProducts') }}</h3>
      <p class="mt-1 text-gray-500 dark:text-gray-400">
        <template v-if="debouncedSearch || statusFilter !== 'all' || stockFilter !== 'all'">
          {{ t('admin.products.noResultsWithFilters') }}
        </template>
        <template v-else>
          {{ t('admin.products.noProductsDescription') }}
        </template>
      </p>
      <button
          v-if="debouncedSearch || statusFilter !== 'all' || stockFilter !== 'all'"
          @click="debouncedSearch = ''; searchQuery = ''; statusFilter = 'all'; stockFilter = 'all'"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {{ t('admin.clearFilters') }}
      </button>
      <button
          v-else
          @click="router.push({ name: 'app-product-create' })"
          @click.stop="router.push({ name: 'app-product-detail', params: { slug: product.slug } })"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {{ t('admin.products.addNew') }}
      </button>
    </div>

    <!-- Product table (default admin view) -->
    <div v-else-if="viewMode === 'table'">
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
          <tr dir="">
<!--            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-8">-->
<!--              <input-->
<!--                  type="checkbox"-->
<!--                  :checked="selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0"-->
<!--                  @change="toggleSelectAll"-->
<!--                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"-->
<!--              />-->
<!--            </th>-->
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {{ t('admin.product') }}
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {{ t('admin.status') }}
            </th>
<!--            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">-->
<!--              {{ t('admin.stock') }}-->
<!--            </th>-->
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {{ t('admin.price') }}
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {{ t('admin.actions') }}
            </th>
          </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="product in paginatedProducts" :key="product.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
<!--            <td class="px-6 py-4 whitespace-nowrap">-->
<!--              <input-->
<!--                  type="checkbox"-->
<!--                  :value="product.id"-->
<!--                  v-model="selectedProducts"-->
<!--                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"-->
<!--              />-->
<!--            </td>-->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <img class="h-32 w-32 rounded-md object-contain" :src="product.thumbnail.src" :alt="product.thumbnail.alt" />
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ product.title }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ product.meta.find(m => m.meta_key === 'brand')?.meta_information?.title || '' }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="{
                    'bg-green-100 text-green-800': product.status  ,
                    'bg-yellow-100 text-yellow-800': product.status === 'draft',
                    'bg-red-100 text-red-800': !product.status ,
                    'bg-gray-100 text-gray-800': !product.status
                  }"
                >
                  {{ product.status?'Active':'Inactive' }}
                </span>
            </td>
<!--            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">-->
<!--              <template v-if="product.meta.find(m => m.meta_key === 'stock')">-->
<!--                {{ product.meta.find(m => m.meta_key === 'stock').meta_value }}-->
<!--                <span class="ml-1 text-xs" :class="{-->
<!--                    'text-green-600 dark:text-green-400': parseInt(product.meta.find(m => m.meta_key === 'stock').meta_value) > 0,-->
<!--                    'text-red-600 dark:text-red-400': parseInt(product.meta.find(m => m.meta_key === 'stock').meta_value) <= 0-->
<!--                  }">-->
<!--                    {{ parseInt(product.meta.find(m => m.meta_key === 'stock').meta_value) > 0 ? t('admin.inStock') : t('admin.outOfStock') }}-->
<!--                  </span>-->
<!--              </template>-->
<!--              <template v-else>-->
<!--                {{ t('admin.unknown') }}-->
<!--              </template>-->
<!--            </td>-->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ product.meta.find(m => m.meta_key === 'price')?.meta_value || '0' }} تومان
            </td>
            <td class="  py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex justify-center space-x-2">
                <button
                    @click.stop="router.push({ name: 'app-product-detail', params: { slug: product.slug } })"
                    class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-500"
                >
                  {{ t('admin.edit') }}
                </button>
<!--                <button-->
<!--                    @click.stop="console.log('Quick edit', product.id)"-->
<!--                    class="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-500"-->
<!--                >-->
<!--                  {{ t('admin.quickEdit') }}-->
<!--                </button>-->
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        {{ t('pagination.showing') }} {{ (currentPage - 1) * itemsPerPage + 1 }} -
        {{ Math.min(currentPage * itemsPerPage, productList.length) }} {{ t('pagination.of') }}
        {{ productList.length }} {{ t('pagination.products') }}
      </div>

      <nav class="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-2 py-2 rounded-s-md border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span class="sr-only">{{ t('pagination.previous') }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </button>

        <template v-for="page in totalPages" :key="page">
          <button
              v-if="Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages"
              @click="goToPage(page)"
              :class="{
              'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-300': currentPage === page,
              'bg-white dark:bg-gray-800 border-gray-300 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700': currentPage !== page
            }"
              class="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
          >
            {{ page }}
          </button>
          <span
              v-else-if="Math.abs(page - currentPage) === 3"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            ...
          </span>
        </template>

        <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="relative inline-flex items-center px-2 py-2 rounded-e-md border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span class="sr-only">{{ t('pagination.next') }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>