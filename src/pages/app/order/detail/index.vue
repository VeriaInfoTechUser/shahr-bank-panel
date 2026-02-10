<script setup>
import {ref, computed, onMounted, watch} from 'vue';
import {useFetch} from "@/composables/useFetch.js";
import {uri} from "@/constants/config.js";
import {useRoute, useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import BaseInputSelect from "@/base-components/Form/BaseInputSelect.vue";
import tr from "@/base-components/Table/Tr.vue";
import Button from "@/base-components/Button/index.js";

const {t} = useI18n();
const route = useRoute();
const router = useRouter();

const order = ref(null);
const newStatus = ref(null);
const loading = ref(true);
const error = ref(null);
const props = defineProps({
  slug: {
    type: String,
    required: true
  }
})
// Format price for display
const formatPrice = (price) => {
  return new Intl.NumberFormat('fa-IR').format(price);
};

// Format date for display
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('fa-IR') + ' ' + date.toLocaleTimeString('fa-IR');
};

// Get status color and text
const getStatusInfo = (status) => {
  switch (status) {
    case 'waiting':
      return {color: 'bg-yellow-100 text-yellow-800', text: t('admin.orders.status.waiting')};
    case 'processing':
      return {color: 'bg-blue-100 text-blue-800', text: t('admin.orders.status.processing')};
    case 'completed':
      return {color: 'bg-green-100 text-green-800', text: t('admin.orders.status.completed')};
    case 'cancelled':
      return {color: 'bg-red-100 text-red-800', text: t('admin.orders.status.cancelled')};
    default:
      return {color: 'bg-gray-100 text-gray-800', text: status};
  }
};

// Fetch order details
const fetchOrder = async () => {
  try {
    loading.value = true;
    const {data, error: fetchError} = useFetch(`${uri.admin.order.get}`, {
      body: {
        slug: props.slug
      }
    });
    order.value = data || null;
  } catch (err) {
    error.value = err;
  } finally {
    loading.value = false;
  }
};


const { data: statusWrapper,  isFetching   } = useFetch(`${uri.admin.order.status.list}`, {
  body: { type: 'order', limit: 1000 }
});

// Safely access the order list
const statusList = computed(() => {
  return statusWrapper.value?.data?.list || [];
});

onMounted(() => {
  fetchOrder();
});

function update(){
  loading.value = true
  useFetch(`${uri.admin.order.status.update}`, {
    body: { status: newStatus.value.value, id: order?.value?.value?.data?.id }
  });
  fetchOrder();
}

</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- Back button -->
    <button
        @click="router.go(-1)"
        class="mb-6 flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-600"
    >
      <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
      </svg>
      {{ t('admin.backToOrders') }}
    </button>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
      <strong class="font-bold">{{ t('error') }}!</strong>
      <span class="block sm:inline">{{ error.message || t('admin.orders.loadError') }}</span>
    </div>

    <!-- Order details -->
    <div v-else class="space-y-6">
      <!-- Order header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">
            {{ t('admin.orders.order') }} #{{ order?.value?.data.id }}
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ t('admin.orders.placedOn') }} {{ order?.value?.data.time_create_view }}
          </p>
        </div>

        <div class="flex items-center gap-4">
          <span
              class="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full"
              :class="getStatusInfo(order?.value?.data.status).color"
          >
            {{$t('order.'+(order?.value?.data.status)) }}
          </span>

        </div>
      </div>

      <!-- Order summary cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Customer card -->
        <div class="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ t('admin.orders.customer') }}
            </h3>
          </div>
          <div class="px-4 py-5 sm:p-6">
            <div class="flex items-center space-x-4">
              <div
                  class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <div>
                <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ order?.value?.data.user?.first_name || t('admin.guest') }}
                  {{ order?.value?.data.user?.last_name || '' }}
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ order?.value?.data.information?.address?.phone || t('admin.orders.noPhone') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Order info card -->
        <div class="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ t('admin.orders.orderInfo') }}
            </h3>
          </div>
          <div class="px-4 py-5 sm:p-6 space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('admin.orders.orderType') }}:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ order?.value?.data.order_type }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('admin.orders.paymentMethod') }}:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{
                  order?.value?.data.payment_method
                }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('admin.orders.entityType') }}:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{
                  order?.value?.data.entity_type
                }}</span>
            </div>
          </div>
        </div>

        <!-- Summary card -->
        <div class="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ t('admin.orders.summary') }}
            </h3>
          </div>
          <div class="px-4 py-5 sm:p-6 space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('admin.orders.subtotal') }}:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{
                  formatPrice(order?.value?.data.subtotal)
                }} {{ t('admin.currency') }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('admin.orders.discount') }}:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">-{{
                  formatPrice(order?.value?.data.discount)
                }} {{ t('admin.currency') }}</span>
            </div>
            <div class="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <span class="text-base font-medium text-gray-900 dark:text-white">{{ t('admin.orders.total') }}:</span>
              <span class="text-base font-bold text-gray-900 dark:text-white">{{
                  formatPrice(order?.value?.data.total_amount)
                }} {{ t('admin.currency') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Order items -->
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ t('admin.orders.items') }} ({{ order?.value?.data.information?.cart?.total_item_count || 0 }})
          </h3>
        </div>
        <div class="px-4 py-5 sm:p-6">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col"
                    class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ t('admin.orders.product') }}
                </th>
                <th scope="col"
                    class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ t('admin.orders.price') }}
                </th>
                <th scope="col"
                    class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ t('admin.orders.quantity') }}
                </th>
                <th scope="col"
                    class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ t('admin.orders.total') }}
                </th>
              </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="item in order?.value?.data.information?.cart?.items" :key="item.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <img class="h-10 w-10 rounded" :src="item.information?.img || '/placeholder-product.jpg'"
                           :alt="item.information?.title"/>
                    </div>
                    <div class="mr-4">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ item.information?.title }}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ item.information?.parentCategory }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatPrice(item.price_unit) }} {{ t('admin.currency') }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ item.count }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatPrice(item.price) }} {{ t('admin.currency') }}
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Shipping and payment -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Shipping address -->
        <div class="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ t('admin.orders.shippingAddress') }}
            </h3>
          </div>
          <div class="px-4 py-5 sm:p-6">
            <div v-if="order?.value?.data.information?.address" class="space-y-2">
              <p class="text-sm text-gray-900 dark:text-white">
                {{ order?.value?.data.information.address.name }}
              </p>
              <p class="text-sm text-gray-900 dark:text-white">
                {{ order?.value?.data.information.address.address }}
              </p>
              <p class="text-sm text-gray-900 dark:text-white">
                {{ order?.value?.data.information.address.city }}, {{ order?.value?.data.information.address.state }}
              </p>
              <p class="text-sm text-gray-900 dark:text-white">
                {{ order?.value?.data.information.address.zip_code }}
              </p>
              <p class="text-sm text-gray-900 dark:text-white">
                {{ t('admin.orders.phone') }}: {{ order?.value?.data.information.address.phone }}
              </p>
            </div>
            <div v-else class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('admin.orders.noShippingAddress') }}
            </div>
          </div>
        </div>

        <!-- Payment info -->
        <div class="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ t('admin.orders.paymentInfo') }}
            </h3>
          </div>
          <div class="px-4 py-5 sm:p-6">
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('admin.orders.paymentMethod') }}:</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{
                    order?.value?.data.payment_method
                  }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('admin.orders.paymentStatus') }}:</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ order?.value?.data.payment?.length ? t('admin.orders.paid') : t('admin.orders.notPaid') }}
                </span>
              </div>
              <div v-if="order?.value?.data.payment?.length"
                   class="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {{ t('admin.orders.paymentDetails') }}:
                </h4>
                <div v-for="(payment, index) in order?.value?.data.payment" :key="index"
                     class="text-sm text-gray-500 dark:text-gray-400">
                  <p>{{ payment.method }}: {{ formatPrice(payment.amount) }} {{ t('admin.currency') }}</p>
                  <p class="text-xs">{{ formatDate(payment.time_create) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Order notes -->
      <div v-if="order?.value?.data.information?.gift"
           class="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ t('admin.orders.notes') }}
          </h3>
        </div>
        <div class="px-4 py-5 sm:p-6">
          <p class="text-sm text-gray-900 dark:text-white">
            {{ order?.value?.data.information.gift }}
          </p>
        </div>
      </div>

      <!-- Order actions -->
      <div class="flex flex-row justify-end gap-4 pt-6">
        <BaseInputSelect
            v-if="statusList "
            :is-preselect-first="true"
            v-model="newStatus"
            name="name"
            deselect-label=""
            :is-multiple="false"
            track-by="name"
            label="title"
            :options="statusList"
            :searchable="true"
            :allow-empty="false"
        >
        </BaseInputSelect>

        <Button class=" " variant="primary" size="sm" :disabled="!newStatus" @click="update">

        {{ t('button.update') }}
        </Button>


      </div>
    </div>
  </div>
</template>