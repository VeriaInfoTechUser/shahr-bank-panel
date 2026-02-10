<script setup>

import {computed, ref} from "vue";
import {Tab} from "@/base-components/Headless";
import Button from "@/base-components/Button";
import {useRoute, useRouter} from "vue-router";
import {useFetch} from "@/composables/useFetch.js";
import {uri} from "@/constants/config.js";
import {useCountryFlag} from "@/composables/useCountryFlag.js";
import BaseInputSelect from "@/base-components/Form/BaseInputSelect.vue";

const route = useRoute()
const router = useRouter()
const paymentCycle = ref("1")
const regionSelected = ref(null)
const loadingFlag = ref(true)
const flags = ref([])
const regionsList = ref([])
const networkAssetsType = ["IPV6", "IPV4", "Traffic", "Bandwidth"]

async function getRegionsList() {
  loadingFlag.value = true;
  try {
    const {data, error} = await useFetch(uri.api.iaas.region.list, {method: "GET"});
    if (error) {
    } else {
      regionsList.value = data
      for (const item of data) {
        const index = data.indexOf(item);
        const {flag, getFlag} = useCountryFlag();
        getFlag(item.country);
        flags.value[index] = flag.value;
        regionsList.value[index]['flag'] = flag.value;
        regionsList.value[index]['aggregate'] = await getAggregateList(item.id);
      }
    }
  } catch (err) {
  } finally {
    loadingFlag.value = false;
  }
}

async function getAggregateList(regionSelectedId) {
  let response = [];
  try {
    const {data, error} = await useFetch(`${uri.api.iaas.self}${regionSelectedId}`, {method: "GET"});
    if (error) {
    } else {
      response = data
    }
  } catch (err) {
  } finally {
  }
  return response;
}

// Computed functions to handle dynamic price plans
const getCurrentPricePlan = (item) => {
  return computed(() =>
      item.pricePlan.value.find((option) => option.key === paymentCycle.value)?.value || []
  );
};

const getCurrentBasePrice = (item) => {
  return computed(() =>
      item.BasePrice.pricePlan.value.find((option) => option.key === paymentCycle.value)?.value || []
  );
};

function updatePrice(item, key, newPrice) {
  const pricePlan = getCurrentPricePlan(item).value;
  const priceItem = pricePlan.find((plan) => plan.key === key);
  if (priceItem) priceItem.price = newPrice;
}

function titleBuilder(item,networks){

  let title =  "";
  if(networkAssetsType.indexOf(item.assetType) === -1){
    title = item.assetType
  }else{
    title = `${item.assetType} - ${networks.find(network => network.id === item.networkId)?.displayName??''}`
  }
  return title;
}

getRegionsList()
</script>

<template>


  <div class="grid grid-cols-12 gap-3">

    <div class="col-span-12 grid grid-cols-12 gap-3 box mt-2 px-1" v-if="!loadingFlag">
      <div class="col-span-12 xl:col-span-4 md:col-span-6 lg:col-span-6 ">
        <BaseInputSelect
            class="primary mt-3.5"
            v-model="regionSelected"
            name="id"
            deselect-label=""
            :is-multiple="false"
            track-by="id"
            label="displayName"
            :options="regionsList"
            :searchable="false"
            :allow-empty="false"
            :is-preselect-first="true"
        >
        </BaseInputSelect>
      </div>
      <Tab.Group class="max-h-full col-span-12 xl:col-span-8 md:col-span-6 lg:col-span-6 ">
        <div class="top-0 pb-3 xl:sticky">
          <Tab.List
              variant="pills"
              class="p-1 mx-auto mt-3 border border-dashed rounded-md border-slate-300 dark:border-darkmode-300"
          >
            <Tab v-for="value in ['1','3','6','12']" :key="value">
              <Tab.Button
                  as="button"
                  class="w-full py-1.5 px-2"
                  :class="{ active: paymentCycle === value }"
                  @click="paymentCycle = value"
              >
                {{ value }} {{ $t('title.month') }}
              </Tab.Button>
            </Tab>
          </Tab.List>
        </div>
      </Tab.Group>
    </div>

    <div v-for="(item,index) in regionSelected['aggregate']['pricing']" :key="item.id"
         class="col-span-12 xl:col-span-4 md:col-span-6 lg:col-span-6 p-3 box shadow-md rounded-lg"
         v-if="!loadingFlag&&regionSelected">
      <!-- Card Header -->
      <div class="text-base font-bold text-center mb-2">
        {{titleBuilder(item,regionSelected['aggregate']['networks']??[])}}
      </div>
      <!-- Table -->
      <table class="table-auto w-full border-collapse border border-gray-200 rounded-md">
        <thead class="bg-gray-100">
        <tr>
          <th class="border px-4 py-1">{{ $t("title.value") }}</th>
          <th class="border px-4 py-1">{{ $t("title.base-price") }}</th>
          <th class="border px-4 py-1">{{ $t("title.sale-price") }}</th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="(plan, index) in getCurrentPricePlan(item).value"
            :key="index"
        >
          <td class="border px-4 py-1 text-center text-xs">{{ plan.key }}</td>
          <td class="border px-4 py-1 text-center text-xs">
            {{ getCurrentBasePrice(item).value[index]?.price || '-' }}
          </td>
          <td class="border px-4 py-2 text-center">
            {{ plan.price}}
<!--            <input-->
<!--                type="number"-->
<!--                class="w-full px-3 text-xs h-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"-->
<!--                :value="plan.price"-->
<!--                @input="updatePrice(item, plan.key, $event.target.value)"-->
<!--            />-->
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
button {
  transition: all 0.3s ease;
}

button:hover {
  transform: scale(1.05);
}
</style>
