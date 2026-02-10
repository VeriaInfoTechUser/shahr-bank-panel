<script setup>
import BaseDialog from "@/base-components/Dialog/BaseDialog.vue";
import Button from "@/base-components/Button";
import { uri } from "@/constants/config";
import {Form} from "vee-validate";
import {onMounted, ref} from "vue";
import {object} from "yup";
import {generateUniqueInt} from "@/composables/utility";
import {useFetch} from "@/composables/useFetch";
import useValidate from "@/composables/useValidate.js";
import cardBackground from "/image/card.jpeg";
//import chipIcon from "/image/chip.png";

import chipIcon from "../../assets/images/illustrations/card-chip.svg";
import zarinPalLogo from "/image/ipg/zarin-pal.svg";
import {useI18n} from "vue-i18n";
import {useNumberFormat} from "@/composables/useNumberFormat.js";
import BaseCard from "@/base-components/Card/BaseCard.vue";
import InputText from "@/base-components/Form/InputText.vue";
import Vue3Datatable from "@bhplugin/vue3-datatable";
import moment from "moment-jalaali";
import BasePagination from "@/base-components/Table/BasePagination.vue";

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})
const {t: $t} = useI18n()
const emit = defineEmits(['close', 'onSuccess']);

function close() {
  emit('close')
}

function onSuccess() {
  emit('onSuccess')
}

const {formatNumber} = useNumberFormat();
const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/app` : '/app';
const requestParams = ref({
  amount: null,
  adapterId: null,
  returnUrl,
})
const data = null;
const date = "";
const customer = ref({
  id: null,
  email: null,
  first_name: null,
  last_name: null,
});
const validationSchema = object(useValidate(['amount']),);
const walletHistory = ref(null)
const profile = ref(null)
const ipgList = ref([])
const ipgErrorMessageFlag = ref(false)
const depositLoadingFlag = ref(false)
const loadingIpgListFlag = ref(true)
const loadingProfileFlag = ref(true)
const loadingWalletHistoryFlag = ref(true)
const pageOptions = ref({
  count: 1,
  limit: 10,
  page: 1
})
const cols = [
  {field: "counter", title: "#"},
  {field: "creator", title: $t('title.user')},
  {field: "amount", title: $t('title.wallet-amount')},
  {field: "action", title: $t('title.wallet-action')},
  {field: "comment", title: $t('title.comment')},
  {field: "balance", title: $t('title.wallet-balance')},
  {field: "date", title: $t('title.date')},
]

const fetchIpgList = async () => {
  loadingIpgListFlag.value = true;
  try {
    const {data, error} = await useFetch(uri.api.wallet.ipg.list, {method: "GET"});
    if (!error) {
      ipgList.value = data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loadingIpgListFlag.value = false;
  }
};

const fetchWalletHistory = async () => {
  loadingWalletHistoryFlag.value = true;
  try {
    const {data, error} = await useFetch(`${uri.api.wallet.history}?page=${pageOptions.value.page}`, {method: "GET"});
    if (!error) {
      walletHistory.value = data;
      pageOptions.value.count = data.meta.total
      pageOptions.value.limit = data.meta.perPage
    }
  } catch (err) {
    console.error(err);
  } finally {
    loadingWalletHistoryFlag.value = false;
  }
};

const fetchProfile = async () => {
  loadingWalletHistoryFlag.value = true;
  try {
    const {data, error} = await useFetch(uri.api.user.profile.self, {method: "GET"});
    if (!error) {
      profile.value = data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loadingProfileFlag.value = false;
  }
};

function tryDeposit() {
  if (requestParams.value.adapterId == null) {
    ipgErrorMessageFlag.value = true
    return
  }
  ipgErrorMessageFlag.value = false
  depositLoadingFlag.value = true
  walletOnlineCharge()
}

async function walletOnlineCharge() {
  try {
    requestParams.value.amount = Number(requestParams.value.amount)
    requestParams.value.adapterId = Number(requestParams.value.adapterId)
    const {data, error} = await useFetch(uri.api.wallet.charge, {method: "POST", body: requestParams.value});
    if (!error) {
     window.location.href = `${data.url}`;
     if(data.url){
       if(data.url.indexOf("https:")===-1){
         data.url = data.url.replace("https", "https:")
       }
       window.location.href = `${data.url}`;
     }
    }
  } catch (err) {
    console.error(err);
  } finally {
    depositLoadingFlag.value = false;
  }
}

onMounted(async () => {
  try {
    // Run both functions in parallel
    await Promise.all([fetchIpgList(), fetchWalletHistory(), fetchProfile()]);
  } catch (err) {
    console.error("Error during data fetching:", err);
  }
});

</script>

<template>
  <section>
    <BaseDialog
        :size="'w-[95vw]'"
        staticBackdrop
        :open="show"
        :has-footer="true"
        :title="$t('title.wallet')"
        @close="close"
    >

      <div class="rounded-md px-2 py-2 w-full max-h-[78vh] overflow-auto">
        <div class="grid grid-cols-12 gap-4 ">
          <div
              class="flex-1 col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:me-44 md:px-5 sm:px-5 px-5"
          >
            <div class="box shadow-md shadow-primary rounded-xl my-5 bg-black relative">
              <!-- Background Image -->
              <img
                  :src="cardBackground"
                  alt="card"
                  class="rounded-xl opacity-50"
              />

              <!-- Chip Icon -->
              <div class="bg-white w-[15%] absolute top-[40%] end-5">
                <img
                    :src="chipIcon"
                    alt="card"
                    class="rounded-md absolute grayscale-0"
                />
              </div>

              <!-- Card Content -->
              <div class="absolute inset-0 text-white flex flex-col justify-between">
                <!-- Grid Content -->
                <div class="grid grid-cols-3 gap-4 p-5">
                  <div class="lg:text-sm md:text-sm sm:text-xs text-xs font-medium text-gray-300">
                    {{ $t("label.first-name") }}
                  </div>
                  <div class="col-span-2 lg:text-base md:text-sm sm:text-xs text-xs font-medium text-gray-300">
                    {{ profile?.firstName ?? '-' }}
                  </div>
                  <div class="lg:text-sm md:text-sm sm:text-xs text-xs font-medium text-gray-300">
                    {{ $t("label.last-name") }}
                  </div>
                  <div
                      class="col-span-2 lg:text-base md:text-sm sm:text-xs text-xs font-medium text-gray-300 drop-shadow-md">
                    {{ profile?.lastName ?? '-' }}
                  </div>
                </div>
                <!-- Bottom Row -->
                <div class="text-start ps-5 text-yellow-100 lg:text-2xl md:text-xl :text-base text-sm font-bold py-4">
                  {{ `${formatNumber(walletHistory?.data[0]?.balance ?? '0')} ${$t('title.currency-unit')}` }}
                </div>
                <div class="text-start text-white">
                  <div class="grid grid-cols-3 gap-4 p-5">
                    <div class="text-base font-medium text-gray-300">
                      {{ $t("label.national-id") }}
                    </div>
                    <div class="col-span-2 text-base font-medium text-gray-300">
                      {{ profile?.nationalCode ?? '-' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
              class="flex-1 shadow-md col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6 gap-2 my-5 mx-5 rounded-md flex-col justify-between"
          >
            <div
                class="flex items-center px-2 text-base rounded-t-md font-medium border-b border-slate-200/60 dark:border-darkmode-400 pb-1 bg-secondary"
            >
              <div class="w-56 text-sm p-1">
                {{ $t('title.fast-charge') }}
              </div>
            </div>

            <Form id="myForm" :validation-schema="validationSchema" @submit="tryDeposit" class="px-2">
              <ParagraphShimmer :lines="7" :is-loading="depositLoadingFlag" class="mt-10"/>
              <div class="grid grid-cols-12 gap-4 mt-5 gap-y-5" v-if="!depositLoadingFlag">
                <div class="col-span-12 intro-y sm:col-span-12">
                  <InputText
                      name="amount"
                      :has-label="true"
                      :label="$t('label.wallet-amount')"
                      v-model="requestParams.amount"
                      id="input-wizard-3"
                      type="text"
                      dir="ltr"
                  />
                </div>
                <div class="col-span-12 intro-y sm:col-span-12">
                  <div>
                        <span>
                          {{ $t("label.ipg") }}
                        </span>
                  </div>
                  <div class="py-5 flex flex-wrap gap-4">
                    <div v-for="ipg in ipgList?.data??[]" class=" flex flex-row gap-3">
                      <div>
                        <input name="ipgId" type="radio"
                               @click="requestParams.adapterId =ipg.id"
                               class="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-slate-300 checked:border-slate-400 transition-all"
                               id="html">
                      </div>
                      <div>
                        <div>
                          <img
                              :src="zarinPalLogo"
                              alt="logo"
                              class="max-h-10 max-w-16"/>
                        </div>
                        <div>
                      <span>
                        {{ ipg.displayName }}
                      </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span v-if="ipgErrorMessageFlag" class="text-red-600 text-[10px] font-bold">
                    * {{ $t(`message.ipg-required`) }}
                    </span>
                </div>
              </div>
              <div class="ps-2 text-sm text-gray-700" v-if="!depositLoadingFlag">
                <strong>
                  {{$t("message.deposit-tax")}}
                </strong>
                <strong>
                  {{ formatNumber(Number(requestParams.amount) + Math.ceil((Number(requestParams.amount) ?? 0) * 0.1)) }}
                </strong>
              </div>
            </Form>

            <div class="flex col-md-12 items-end justify-end gap-2 pe-5 pb-10" v-if="!depositLoadingFlag">
              <Button variant="soft-primary" size="sm" form="myForm" class=" shadow-md justify-end items-end p-2 text-sm">
                {{ $t('button.deposit') }}
              </Button>
            </div>


          </div>

          <div class="col-span-12 px-5">
            <BaseCard
                class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12"
                :title="$t('title.history')"
            >
              <template v-slot:body>
                <vue3-datatable
                    :columns="cols"
                    :rows="walletHistory?.data"
                    :loading="loadingWalletHistoryFlag"
                    :totalRows="pageOptions.count"
                    :isServerMode="true"
                    :pageSize="pageOptions.limit"
                    :pagination="false"
                    :sortable="false"
                    class="advanced-table text-start items-start justify-start"
                    rowClass="cursor-pointer"
                >
                  <!-- Empty header slot to remove the header -->
                  <template #header>
                    <!-- No content here will hide the header -->
                  </template>
                  <!-- Empty footer slot to remove the footer -->
                  <template #footer>
                    <!-- No content here will hide the footer -->
                  </template>

                  <template #counter="data,key">
                    <div class="text-start">

                      {{
                        (walletHistory?.data.indexOf(data.value) + 1) + ((pageOptions.page - 1) * pageOptions.limit)
                      }}
                    </div>
                  </template>
                  <template #creator="data,key">
                    <div class="text-start">
                      {{ `${data.value.Creator?.Profile?.firstName} ${data.value.Creator?.Profile?.lastName}` }}
                    </div>
                  </template>
                  <template #amount="data,key">
                    <div class="text-start">
                      {{ formatNumber(data.value.amount) }}
                    </div>
                  </template>
                  <template #balance="data,key">
                    <div class="text-start">
                      {{ formatNumber(data.value.balance) }}
                    </div>
                  </template>
                  <template #date="data,key">
                    <div class="text-start" dir="ltr">
                      {{ moment(data.value.createdAt).locale("fa").format("jYYYY/jMM/jDD HH:mm:ss") }}
                    </div>
                  </template>
                  <template #action="data,key">
                    <div class="text-start" v-if="!loadingWalletHistoryFlag">

                      <Button :variant="(data.value.action==='ACTION_WITHDRAW')?'outline-warning':'outline-success'"
                              size="sm"
                              class="inline-block w-16 mb-2 mr-1">
                        {{ data.value.action === 'ACTION_WITHDRAW' ? $t("title.withdraw") : $t("title.deposit") }}
                      </Button>
                    </div>
                  </template>
                </vue3-datatable>
                <div
                    class="flex flex-col items-center p-5 text-center sm:flex-row sm:text-start text-slate-500"
                >
                  <div>

                    <BasePagination
                        v-if="pageOptions.count>pageOptions.limit"
                        :page-options="pageOptions"
                        @page-change="fetchWalletHistory"
                    />

                  </div>
                </div>

              </template>
            </BaseCard>
          </div>
        </div>
      </div>


    </BaseDialog>
  </section>
</template>
