<script setup>
import Button from "@/base-components/Button";
import Lucide from "@/base-components/Lucide";
import {useFetch} from "@/composables/useFetch.js";
import {onMounted, ref} from "vue";
import Vue3Datatable from "@bhplugin/vue3-datatable";
import "@bhplugin/vue3-datatable/dist/style.css";
import {useRoute, useRouter} from "vue-router";
import {uri} from "@/constants/config.js";
import TicketDialog from "./TicketDialog.vue";
import "vue-awesome-paginate/dist/style.css";
import BasePagination from "@/base-components/Table/BasePagination.vue";
import {useI18n} from "vue-i18n";

const {t: $t} = useI18n()
const route = useRoute()
const router = useRouter()
const ticketList = ref([])
const isLoadingFlag = ref(true)
const cols = [
  {field: "counter", title: "#"},
  {field: "id", title: $t('title.id')},
  {field: "department", title: $t('title.department')},
  {field: "title", title: $t('title.title')},
  {field: "status", title: $t('title.status')},
  {field: "createdAt", title: $t('title.created-at')},
  {field: "updatedAt", title: $t('title.updated-at')},
  {field: "closedAt", title: $t('title.closed-at')},
]
const pageOptions = ref({
  count: 1,
  limit: 10,
  page: 1
})

const filterData = ref({
  type:"ticket",
  data_from: "",
  data_to: "",
  support_product_title: null,
  support_title: null,
  support_order_status: null,
  support_status: null
})
const tempFilterData = ref({
  type:"ticket",
  data_from: "",
  data_to: "",
  support_product_title: null,
  support_title: null,
  support_order_status: null,
  support_status: null
})
function onSuccessOpenTicket() {
  setOpenTicketFlag(false);
  fetchData()
}

const getTicketList = async () => {
  isLoadingFlag.value = true
  let response = []
  try {
    const {data, error} = await useFetch(`${uri.admin.support.item.list}`, {body:{...filterData.value,...pageOptions.value}});
    if (data) {
      response = data.data
      pageOptions.value = data.data.paginator
    }
  } catch (err) {
    console.log(err)
  }
  return response
}

const fetchData = async () => {
  try {
    const [ticket] = await Promise.all([
      getTicketList(),
    ]);
    ticketList.value = ticket.list;
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    isLoadingFlag.value = false
  }
}

const openTicketFlag = ref(false)

function setOpenTicketFlag(value) {
  openTicketFlag.value = value
}

function openTicketDialog() {
  openTicketFlag.value = true
}

function rowClick(ticket) {
  router.push(`/app/support/ticket/${ticket.id}`)
}


// Fetch data when the component mounts
onMounted(fetchData);

</script>
<template>
  <section>
    <TicketDialog
        v-if="openTicketFlag"
        @close="setOpenTicketFlag(false)"
        @onSuccess="onSuccessOpenTicket"
        :show="openTicketFlag"
    />

    <div class="grid grid-cols-12 gap-6 mt-8">
      <div class="col-span-12 lg:col-span-12 2xl:col-span-12">
        <!-- BEGIN: Inbox Content -->
        <div class="mt-5 intro-y box">
          <div
              class="flex p-5 border-b sm:flex-row text-slate-500 border-slate-200/60 text-end w-full justify-end items-end"
          >
            <div class="w-5 h-5 ms-5 cursor-pointer" @click="fetchData">
              <Lucide icon="RefreshCw" class="w-6 h-6"/>
            </div>
            <div class="w-5 h-5 ms-5 cursor-pointer" @click="openTicketDialog">
              <Lucide icon="PlusCircle" class="w-6 h-6"/>
            </div>
          </div>
          <div class="mb-5 relative">
          </div>

          <vue3-datatable
              :columns="cols"
              :rows="ticketList"
              :loading="isLoadingFlag"
              :totalRows="pageOptions.count"
              :isServerMode="true"
              :pageSize="pageOptions.limit"
              :pagination="false"
              :sortable="false"
              class="advanced-table px-4 text-start items-start justify-start"
              rowClass="cursor-pointer"
              @rowClick="rowClick"
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
                  (ticketList.indexOf(data.value) + 1) + ((pageOptions.page - 1) * pageOptions.limit)
                }}
              </div>
            </template>

            <template #department="data,key">
              <div class="text-start">
                {{ data.value.department?.title}}
              </div>
            </template>

            <template #id="data,key">
              <div class="text-start">
                {{ data.value.id }}
              </div>
            </template>

            <template #title="data,key">
              <div class="text-start">
                {{ data.value.title }}
              </div>
            </template>

            <template #createdAt="data,key">
              <div class="text-start" >
                {{ data.value.time_create_view }}
              </div>
            </template>
            <template #updatedAt="data,key">
              <div class="text-start" >
                {{ data.value.time_update_view}}
              </div>
            </template>
            <template #closedAt="data,key">
              <div class="text-start" >

              </div>
            </template>

            <template #status="data,key">
              <div class="text-start" >
                <Button :variant="(data.value.is_open)?'outline-success':'outline-warning'"
                        size="sm"
                        class="inline-block w-16 mb-2 mr-1">
                  {{data.value.is_open ? $t("title.open") : $t("title.open") }}
                </Button>
              </div>
            </template>

          </vue3-datatable>
          <div
              class="flex flex-col items-center p-5 text-center sm:flex-row sm:text-left text-slate-500"
          >
            <div>

              <BasePagination
                  v-if="pageOptions.count>pageOptions.limit"
                  :page-options="pageOptions"
                  @page-change="fetchData"
              />
            </div>
            <div class="mt-2 sm:ml-auto sm:mt-0">
            </div>
          </div>
        </div>
        <!-- END: Inbox Content -->
      </div>
    </div>
  </section>
</template>
