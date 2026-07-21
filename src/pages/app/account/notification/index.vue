<script setup>
import ProfileCard from "../ProfileCard.vue";
import { ref, watch } from "vue";
import { useScroll } from "@/composables/useScroll.js";
import { useUserStore } from "@/stores/user";
import { notificationRepo } from "@/core/repositories/notificationRepo";
import Vue3Datatable from "@bhplugin/vue3-datatable";
import BasePagination from "@/base-components/Table/BasePagination.vue";


const notificationListProcessing = ref(false)
const notificationProcessing = ref(false)
const fetchError = ref(false)
const currentNotificationList = ref([])
const limit = ref(10)
const page = ref(1)
const currentNotification = ref({})
const defaultNotification = {}
const cols = ref([
  {field: "id", title: 'id'},
  {field: "title", title: 'Title'},
  {field: "body", title: 'Body'},
  {field: "module", title: 'Module'},
  {field: "section", title: 'Section'},
])
const updateNotificationLoadingFlag = ref(false)
const showNotificationFlag = ref(false)
const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0)
const {scrollTo} = useScroll()
const handlePageChange = (newPage) => {
  currentPage.value = newPage
  page.value = newPage
  fetchNotificationRequest()
  scrollTo(0)
};
const onLimitChange = (newLimit) => {
  page.value = 1
  currentPage.value = 1
  limit.value = newLimit.value
  fetchNotificationRequest()
  scrollTo(0)
}

const user = useUserStore()

function setNotificationListProcessing(payload) {
  notificationListProcessing.value = payload
  fetchError.value = null
}

function clearFetchError() {
  fetchError.value = null
}

function setFetchError(payload) {
  fetchError.value = payload
  currentNotificationList.value = []
  Object.assign(currentNotification.value, defaultNotification);
  notificationProcessing.value = false
  notificationListProcessing.value = false
}

function setNotificationList(payload) {
  currentNotificationList.value = payload
  notificationListProcessing.value = false
  fetchError.value = null
}
const pageOptions = ref({
  count: 1,
  limit: 25,
  page: 1
})

async function fetchNotificationRequest() {
  clearFetchError();
  setNotificationListProcessing(true);
  try {
    const result = await notificationRepo.getList(pageOptions.value);
    if (result?.result) {
      await user.requestNotificationCount();
      pageOptions.value = result.data.paginator;
      setNotificationList(result.data.list);
    } else {
      setFetchError("Error");
    }
  } catch (err) {
    setFetchError("Error");
  } finally {
    setNotificationListProcessing(false);
  }
}

async function updateStatusNotificationRequest() {
  if (currentNotification.value == null) {
    return
  }
  setNotificationListProcessing(true)
  // const {data, error} = await API.updateNotificationRequest({id:currentNotification.value.id})
  // if (data.value) {
  //   await fetchNotificationRequest();
  // } else if (error.value) {
  //   ///TODO:set alert for error in delete notification
  //   await fetchNotificationRequest();
  // }
}

function showNotificationDialog(notification) {
  Object.assign(currentNotification.value, notification);
  showNotificationFlag.value = true
  const modal = document.getElementById('show_notification_modal');
  modal.showModal();
}

function closeViewModal(){
  showNotificationFlag.value = false
  const modal = document.getElementById('show_notification_modal');
  modal.close();
}

fetchNotificationRequest()

watch(showNotificationFlag,(value)=>{
  if(!value){
    updateStatusNotificationRequest()
  }
})


</script>

<template>
  <section>
    <div class="min-h-[57vh] box">
      <div class=" ">
        <div class=" intro-y box">
          <vue3-datatable
              :columns="cols"
              :rows="currentNotificationList"
              :loading="notificationListProcessing"
              :totalRows="pageOptions.count"
              :isServerMode="true"
              :pageSize="pageOptions.limit"
              :pagination="false"
              :sortable="false"
              class="advanced-table whitespace-nowrap px-4"
          />
          <div
              class="flex flex-col items-center p-5 text-center sm:flex-row sm:text-left text-slate-500"
          >
            <div>
              <BasePagination
                  v-if="pageOptions.count>pageOptions.limit"
                  :page-options="pageOptions"
                  @page-change="fetchNotificationRequest"
              />
            </div>
            <div class="mt-2 sm:ml-auto sm:mt-0">

            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>

</style>