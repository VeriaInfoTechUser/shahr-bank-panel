<script setup>
import {computed, ref} from 'vue';
import {useFetch} from "@/composables/useFetch.js";
import {uri} from "@/constants/config.js";
import {useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {debounce} from 'lodash-es';

const { t } = useI18n();
const router = useRouter();

// Admin-specific states
const selectedOrders = ref([]);
const bulkAction = ref('');
const showFilters = ref(false);
const statusFilter = ref('all');

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

const { data: orders, error, isFetching, execute: refreshOrders } = useFetch(`${uri.admin.order.list}`, {
  body: { type: 'order', limit: 1000 }
});

// Safely access the order list
const orderList = computed(() => {
  return orders.value?.data?.list || [];
});

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(orderList.value.length / itemsPerPage.value);
});

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return orderList.value.slice(start, end);
});

// Format price for display
const formatPrice = (price) => {
  return new Intl.NumberFormat('fa-IR').format(price);
};

// Get status color and text
const getStatusInfo = (status) => {
  switch (status) {
    case 'waiting':
      return { color: 'bg-yellow-100 text-yellow-800', text: t('admin.orders.status.waiting') };
    case 'processing':
      return { color: 'bg-blue-100 text-blue-800', text: t('admin.orders.status.processing') };
    case 'completed':
      return { color: 'bg-green-100 text-green-800', text: t('admin.orders.status.completed') };
    case 'cancelled':
      return { color: 'bg-red-100 text-red-800', text: t('admin.orders.status.cancelled') };
    default:
      return { color: 'bg-gray-100 text-gray-800', text: status };
  }
};

// Change items per page
const changeItemsPerPage = (value) => {
  itemsPerPage.value = value;
  currentPage.value = 1;
};

// Change page
const goToPage = (value) => {
  currentPage.value = value;
};
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- Admin header with actions -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white">
          {{ t('admin.orders.title') }}
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('admin.orders.manageYourOrders') }}
        </p>
      </div>
    </div>

    <!-- Admin controls bar -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- Bulk actions -->
        <div class="flex items-center gap-2 w-full md:w-auto">
          <!-- Bulk actions can be added here -->
        </div>

        <!-- Search and filters -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
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
                :placeholder="t('admin.searchOrders')"
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Results count -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        {{ t('pagination.showing') }}
        <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
        {{ t('pagination.to') }}
        <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, orderList.length) }}</span>
        {{ t('pagination.of') }}
        <span class="font-medium">{{ orderList.length }}</span>
        {{ t('pagination.orders') }}
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
      <span class="block sm:inline">{{ error.message || t('admin.orders.loadError') }}</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="orderList.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-white">{{ t('admin.orders.noOrders') }}</h3>
      <p class="mt-1 text-gray-500 dark:text-gray-400">
        <template v-if="debouncedSearch || statusFilter !== 'all'">
          {{ t('admin.orders.noResultsWithFilters') }}
        </template>
        <template v-else>
          {{ t('admin.orders.noOrdersDescription') }}
        </template>
      </p>
      <button
          v-if="debouncedSearch || statusFilter !== 'all'"
          @click="debouncedSearch = ''; searchQuery = ''; statusFilter = 'all'"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {{ t('admin.clearFilters') }}
      </button>
    </div>

    <!-- Order table (default admin view) -->
    <div v-else-if="viewMode === 'table'">
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
          <tr dir="">
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {{ t('admin.order') }}
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {{ t('admin.customer') }}
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {{ t('admin.date') }}
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {{ t('admin.total') }}
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {{ t('admin.status') }}
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {{ t('admin.actions') }}
            </th>
          </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="order in paginatedOrders" :key="order.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                #{{ order.id }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900 dark:text-white">
                {{ order.user?.first_name || t('admin.guest') }} {{ order.user?.last_name || '' }}  {{ order.user?.mobile  }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900 dark:text-white">
                {{ order.time_create_view }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900 dark:text-white">
                {{ formatPrice(order.total_amount) }} {{ t('admin.currency') }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="getStatusInfo(order.status).color"
              >
            {{$t('order.'+(order?.status)) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex justify-center space-x-2">
                <button
                    @click.stop="router.push({ name: 'app-order-detail', params: { slug: order.slug } })"
                    class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-500"
                >
                  {{ t('admin.view') }}
                </button>
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