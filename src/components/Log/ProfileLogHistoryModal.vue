<script setup>

import BaseTable from "@/components/table/BaseTable.vue";
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import API from "@/services/API.js";
import Modal from "@/components/Modal.vue";

const props = defineProps({
  showLogHistoryModalFlag: Boolean,
  currentUser: Object,
  modalId: {
    type: String,
    default: "profile_log_history_modal",
  },
});

const emit = defineEmits(['close']);
const {t: $t} = useI18n()
const userLogListProcessing = ref(false)
const userProcessing = ref(false)
const fetchError = ref(false)
const currentProfileLogList = ref([])
const tableHeaders = [
  {
    label: "table.user-id",
    key: "user_id",
  },
  {
    label: "table.name",
    key: "user_name",
  },
  {
    label: "table.email",
    key: "user_email",
  },
  {
    label: "table.state",
    key: "state",
  },
  {
    label: "table.operator",
    key: "operator",
  },
  {
    label: "table.method",
    key: "method",
  },
  {
    label: "table.ip",
    key: "ip",
  },
  {
    label: "table.created-at",
    key: "time_create_view",
  },
]
const limit = ref(10)
const page = ref(1)
// const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0)
// const {scrollToTop} = useScrollToTop()
// const handlePageChange = (newPage) => {
//   currentPage.value = newPage
//   page.value = newPage
//   listProfileLogRequest()
//   scrollToTop()
// };
// const onLimitChange = (newLimit) => {
//   page.value = 1
//   currentPage.value = 1
//   limit.value = newLimit.value
//   listProfileLogRequest()
//   scrollToTop()
// };

function setProfileLogListProcessing(payload) {
  userLogListProcessing.value = payload
  fetchError.value = null
}

function clearFetchError() {
  fetchError.value = null
}

function setFetchError(payload) {
  fetchError.value = payload
  currentProfileLogList.value = []
  userProcessing.value = false
  userLogListProcessing.value = false
}

function setProfileLogList(payload) {
  currentProfileLogList.value = payload
  userLogListProcessing.value = false
  fetchError.value = null
}

async function listProfileLogRequest() {
  clearFetchError()
  setProfileLogListProcessing(true)
  let request = {
    "limit": limit.value,
    "page": page.value,
  }
  const {data, error} = await API.profileHistoryRequest(JSON.stringify(request))
  if (data.value) {
    totalCount.value = data.value.data.paginator.count
    totalPages.value = Math.ceil(totalCount.value / limit.value)
    setProfileLogList(data.value.data.list)
  } else if (error.value) {
    setFetchError(error.value)
  }
  setProfileLogListProcessing(false)
}

listProfileLogRequest()

onMounted(() => {
  const modal = document.getElementById('history_modal');
  modal.showModal();
})

</script>

<template>
  <section>
    <Modal
        @close="close"
        :title="$t('modal.user-log-history')"
        :id="'history_modal'"
        :custom-style="'max-w-5xl h-[vh-80]'"
        :close-btn="false"
        :close-backdrop="true"
        :close-icon="true"
    >
      <div class="pt-2">
        <div class="min-h-96 overflow-auto">
          <BaseTable
              class="w-full"
              :is-loading="userLogListProcessing"
              :data="currentProfileLogList"
              :headers="tableHeaders"
          >
            <template v-slot:cell(user_name)="{data,index}">
              <div class="flex gap-2">
                {{ data.item.user_name ?? '-' }}
              </div>
            </template>
            <template v-slot:cell(user_email)="{data,index}">
              <div class="flex gap-2">
                {{ data.item.user_email ?? '-' }}
              </div>
            </template>
            <template v-slot:cell(operator)="{data,index}">
              <div class="flex gap-2">
                {{ data.item.information.operator ? data.item.information.operator.name : '-' }}
              </div>
            </template>

            <template v-slot:cell(method)="{data,index}">
              <div class="flex gap-2">
                {{ data.item.information.method ?? '-' }}
              </div>
            </template>
            <template v-slot:cell(ip)="{data,index}">
              <div class="flex gap-2">
                {{ data.item.information.ip }}
              </div>
            </template>
          </BaseTable>
        </div>
<!--        <div class="flex ">-->
<!--          <div class="w-full grid grid-cols-2">-->
<!--            <div class="justify-start relative pt-4">-->
<!--              <BasePagination-->
<!--                  class="ms-0 w-full"-->
<!--                  :size="'xs'"-->
<!--                  v-if="totalPages>1"-->
<!--                  :typeStyle="2"-->
<!--                  :currentPage="currentPage"-->
<!--                  :totalPages="totalPages"-->
<!--                  @page-change="handlePageChange"-->
<!--                  @limit-change="onLimitChange"-->
<!--              />-->
<!--            </div>-->
<!--          </div>-->
<!--          <div class="pt-3">-->
<!--          </div>-->
<!--        </div>-->
      </div>
    </Modal>
  </section>
</template>

<style scoped>

</style>