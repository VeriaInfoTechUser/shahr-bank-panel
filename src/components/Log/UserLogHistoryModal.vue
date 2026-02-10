<script setup>
import Modal from "@/components/Modal.vue";
import BaseTable from "@/components/table/BaseTable.vue";
import BaseButton from "@/components/BaseButton.vue";
import {ref} from "vue";
import BasePagination from "@/components/table/BasePagination.vue";
import {useI18n} from "vue-i18n";
import API from "@/services/API.js";
import {useScrollToTop} from "@/composables/useScrollToTop.js";

const props = defineProps({
  showLogHistoryModalFlag: Boolean,
  currentUser: Object,
  modalId: {
    type: String,
    default: "user_log_history_modal",
  },
});

const emit = defineEmits(['close']);
const close = () => {
  emit('close');
};
const {t: $t} = useI18n()
const userLogListProcessing = ref(false)
const userProcessing = ref(false)
const fetchError = ref(false)
const currentUserLogList = ref([])
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
const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0)
const {scrollToTop} = useScrollToTop()
const handlePageChange = (newPage) => {
  currentPage.value = newPage
  page.value = newPage
  listUserLogRequest()
  scrollToTop()
};
const onLimitChange = (newLimit) => {
  page.value = 1
  currentPage.value = 1
  limit.value = newLimit.value
  listUserLogRequest()
  scrollToTop()
};

function setUserLogListProcessing(payload) {
  userLogListProcessing.value = payload
  fetchError.value = null
}

function clearFetchError() {
  fetchError.value = null
}

function setFetchError(payload) {
  fetchError.value = payload
  currentUserLogList.value = []
  userProcessing.value = false
  userLogListProcessing.value = false
}

function setUserLogList(payload) {
  currentUserLogList.value = payload
  userLogListProcessing.value = false
  fetchError.value = null
}

async function listUserLogRequest() {
  clearFetchError()
  setUserLogListProcessing(true)
  let request = {
    "limit": limit.value,
    "page": page.value,  
    "user_id": props.currentUser.id,
  }
  const {data, error} = await API.listUserLogRequest(JSON.stringify(request))
  if (data.value) {
    totalCount.value = data.value.data.paginator.count
    totalPages.value = Math.ceil(totalCount.value / limit.value)
    setUserLogList(data.value.data.list)
  } else if (error.value) {
    setFetchError(error.value)
  }
  setUserLogListProcessing(false)
}
  
listUserLogRequest()
</script>

<template>
  <section>
    <Modal
        @close="close"
        :title="currentUser?currentUser.name?currentUser.name:currentUser.id.toString():$t('modal.user-log-history')"
        :id="modalId"
        :custom-style="'max-w-5xl h-[vh-80]'"
        :close-btn="false"
        :close-backdrop="true"
        :close-icon="true"
    >

      <div>
          <div class="min-h-96 overflow-auto">
                <BaseTable
                    class="w-full"
                    :is-loading="userLogListProcessing"
                    :data="currentUserLogList"
                    :headers="tableHeaders"
                >
                  <template v-slot:cell(user_name)="{data,index}">
                    <div class="flex gap-2">
                      {{data.item.user_name??'-'}}
                    </div>
                  </template>
                  <template v-slot:cell(user_email)="{data,index}">
                    <div class="flex gap-2">
                      {{data.item.user_email??'-'}}
                    </div>
                  </template>
                  <template v-slot:cell(operator)="{data,index}">
                    <div class="flex gap-2">
                      {{data.item.information.operator?data.item.information.operator.name:'-'}}
                    </div>
                  </template>

                  <template v-slot:cell(method)="{data,index}">
                    <div class="flex gap-2">
                      {{data.item.information.method??'-'}}
                    </div>
                  </template>
                  <template v-slot:cell(ip)="{data,index}">
                    <div class="flex gap-2">
                      {{data.item.information.ip}}
                    </div>
                  </template>
                </BaseTable>
          </div>
        <div class="flex ">
          <div class="w-full grid grid-cols-2">
            <div class="justify-start relative pt-4">
                 <BasePagination
                  class="ms-0 w-full"
                  :size="'xs'"
                  v-if="totalPages>1"
                  :typeStyle="2"
                  :currentPage="currentPage"
                  :totalPages="totalPages"
                  @page-change="handlePageChange"
                  @limit-change="onLimitChange"
              />
            </div>
          </div>
          <div class="pt-3">
          <BaseButton type="button" class="btn-outline btn-primary" size="xs" :onclick="modalId+'.close()'" >
            {{ $t('button.close') }}
          </BaseButton>
          </div>
        </div>
      </div>
    </Modal>
  </section>
</template>

<style scoped>

</style>