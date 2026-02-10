<script setup>
import BaseDialog from "@/base-components/Dialog/BaseDialog.vue";
import Lucide from "@/base-components/Lucide";
import {FormInput, FormLabel} from "@/base-components/Form";
import Litepicker from "@/base-components/Litepicker";
import {ref} from "vue";
import {orderStatusList, statusList} from "@/utils/variables";
import BaseInputSelect from "@/base-components/Form/BaseInputSelect.vue";
import Button from "@/base-components/Button";

const emit =defineEmits(['close','filter','removeFilter'])
const props = defineProps({
  show:{
    type:Boolean,
    default:false
  },
  filterData:{
    type:Object,
  },
  isFilterLoading:{
    type:Boolean,
    default:false
  }
})
const dateFormat = "YYYY-MM-DD"
const dataFrom = ref("")
const dataTo = ref("")

function close(){
  emit('close')
}
function filter(){
  emit('filter')
}
function removeFilter(){
  emit('removeFilter')
}

</script>

<template>
  <section>
    <BaseDialog
        :size="'lg'"
        staticBackdrop
        :open="show"
        :has-footer="true"
        :title="$t('title.filter-request')"
        @close="close"
    >
      <div class="grid grid-cols-12 gap-4 p-3 gap-y-3">


        <div class="col-span-12">
          <FormLabel htmlFor="input-filter-3" class="text-xs">
            {{$t('title.request-title')}}
          </FormLabel>
          <FormInput
              id="input-filter-3"
              type="text"
              class="flex-1"
              v-model="filterData.support_title"
          />
        </div>

        <div class="col-span-12 lg:col-span-6 md:col-span-6 xl:col-span-6">
          <FormLabel htmlFor="input-filter-3" class="text-xs">
            {{$t('title.product-title')}}
          </FormLabel>
          <FormInput
              id="input-filter-3"
              type="text"
              class="flex-1"
              v-model="filterData.support_product_title"
          />
        </div>
        <div class="col-span-12 lg:col-span-6 md:col-span-6 xl:col-span-6">
          <FormLabel htmlFor="input-filter-3" class="text-xs">
            {{$t('title.customer-name')}}
          </FormLabel>
          <FormInput
              id="input-filter-3"
              type="text"
              class="flex-1"
              v-model="filterData.support_customer_name"
          />
        </div>
        <div class="col-span-12 lg:col-span-6 md:col-span-6 xl:col-span-6">
          <FormLabel htmlFor="input-filter-3" class="text-xs">
            {{$t('title.customer-email')}}
          </FormLabel>
          <FormInput
              id="input-filter-3"
              type="text"
              class="flex-1"
              v-model="filterData.support_customer_email"
          />
        </div>
        <div class="col-span-12 lg:col-span-6 md:col-span-6 xl:col-span-6">
          <FormLabel htmlFor="input-filter-2" class="text-xs">
            {{ $t('title.follow-up-date') }}
          </FormLabel>
          <div class="relative mx-auto">
            <div
                class="absolute flex items-center justify-center w-10 h-full border rounded-l bg-slate-100 text-slate-500 dark:bg-darkmode-700 dark:border-darkmode-800 dark:text-slate-400"
            >
              <Lucide icon="Calendar" class="w-4 h-4"/>
            </div>
            <Litepicker
                v-model="filterData.support_follow_up_date"
                :options="{
                            autoApply: true,
                            format: dateFormat,
                            showWeekNumbers: true,
                            dropdowns: {
                              minYear: 1990,
                              maxYear: null,
                              months: true,
                              years: true,
                            },
                          }"
                class="pl-12"
            />
          </div>
        </div>
        <div class="col-span-12 lg:col-span-6 md:col-span-6 xl:col-span-6">
          <FormLabel htmlFor="input-filter-2" class="text-xs">
            {{ $t('title.from') }}
          </FormLabel>
          <div class="relative mx-auto">
            <div
                class="absolute flex items-center justify-center w-10 h-full border rounded-l bg-slate-100 text-slate-500 dark:bg-darkmode-700 dark:border-darkmode-800 dark:text-slate-400"
            >
              <Lucide icon="Calendar" class="w-4 h-4"/>
            </div>
            <Litepicker
                v-model="filterData.data_from"
                :options="{
                            autoApply: true,
                            format: dateFormat,
                            showWeekNumbers: true,
                            dropdowns: {
                              minYear: 1990,
                              maxYear: null,
                              months: true,
                              years: true,
                            },
                          }"
                class="pl-12"
            />
          </div>
        </div>
        <div class="col-span-12 lg:col-span-6 md:col-span-6 xl:col-span-6">
          <FormLabel htmlFor="input-filter-2" class="text-xs">
            {{ $t('title.to') }}
          </FormLabel>
          <div class="relative mx-auto">
            <div
                class="absolute flex items-center justify-center w-10 h-full border rounded-l bg-slate-100 text-slate-500 dark:bg-darkmode-700 dark:border-darkmode-800 dark:text-slate-400"
            >
              <Lucide icon="Calendar" class="w-4 h-4"/>
            </div>
            <Litepicker
                v-model="filterData.data_to"
                :options="{
                            autoApply: true,
                            format: dateFormat,
                            showWeekNumbers: true,
                            dropdowns: {
                              minYear: 1990,
                              maxYear: null,
                              months: true,
                              years: true,
                            },
                          }"
                class="pl-12"
            />
          </div>
        </div>
        <div class="col-span-12">
          <FormLabel htmlFor="input-filter-2" class="text-xs">
            {{ $t('title.order-status') }}
          </FormLabel>
            <BaseInputSelect
                class="primary"
                v-model="filterData.support_order_status"
                name="value"
                deselect-label=""
                :is-multiple="false"
                track-by="value"
                label="label"
                :options="orderStatusList??[]"
                :searchable="false"
                :allow-empty="false"
                :is-preselect-first="false"
            >
            </BaseInputSelect>
        </div>
        <div class="col-span-12">
          <FormLabel htmlFor="input-filter-2" class="text-xs">
            {{ $t('title.status') }}
          </FormLabel>
            <BaseInputSelect
                class="primary"
                v-model="filterData.support_status"
                name="value"
                deselect-label=""
                :is-multiple="false"
                track-by="value"
                label="label"
                :options="statusList??[]"
                :searchable="false"
                :allow-empty="false"
                :is-preselect-first="false"
            >
            </BaseInputSelect>
        </div>
      </div>
      <template v-slot:footer>
        <FreeStyleShimmer class="py-3" height="10px" width="100%" v-if="isFilterLoading"/>
        <div class="flex col-md-12 items-end justify-end gap-2" v-else>
          <Button variant="outline-secondary" @click="close" size="sm" class=" shadow-md justify-end items-end">
            {{ $t('button.cancel') }}
          </Button>
          <Button variant="outline-primary" @click="removeFilter" size="sm" class="shadow-md justify-end items-end">
            {{ $t('button.remove-filter') }}
          </Button>
          <Button variant="primary" size="sm" @click="filter" class="shadow-md justify-end items-end">
            {{ $t('button.filter') }}
          </Button>
        </div>
      </template>
    </BaseDialog>
  </section>
</template>

<style scoped>

</style>