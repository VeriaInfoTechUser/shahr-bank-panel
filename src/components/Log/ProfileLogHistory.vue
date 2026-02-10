<script setup>
import { ref } from "vue";
import { useScroll } from "@/composables/useScroll.js";
import { userRepo } from "@/core/repositories/userRepo";
import Vue3Datatable from "@bhplugin/vue3-datatable"; 
import BasePagination from "@/base-components/Table/BasePagination.vue";

const userLogListProcessing = ref(false)
const userProcessing = ref(false)
const fetchError = ref(false)
const currentProfileLogList = ref([]) 
const pageOptions = ref({
  count: 1,
  limit: 10,
  page: 1
})

const {scrollTo} = useScroll()
const cols = ref([
  {field: "user_id", title: 'User id'},
  {field: "user_name", title: "Name"},
  {field: "user_email", title: "Email"},
  {field: "state", title: "State"},
  {field: "operator_name", title: "Operator"},
  {field: "information.method", title: "Method"},
  {field: "information.ip", title: "IP"},
  {field: "time_create_view", title: "Time Create"},
]);

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

async function fetchProfileHistoryRequest() {
  clearFetchError();
  setProfileLogListProcessing(true);
  try {
    const result = await userRepo.getProfileHistory(pageOptions.value);
    if (result?.result) {
      pageOptions.value = result.data.paginator;
      setProfileLogList(result.data.list);
    } else {
      setFetchError("Error");
    }
  } catch (err) {
    setFetchError("Error");
  } finally {
    setProfileLogListProcessing(false);
  }
}

fetchProfileHistoryRequest()
</script>

<template>
  <section>
    <div class=" intro-y box">
      <vue3-datatable
          :columns="cols"
          :rows="currentProfileLogList"
          :loading="userLogListProcessing"
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
              @page-change="fetchProfileHistoryRequest"
          />
        </div>
        <div class="mt-2 sm:ml-auto sm:mt-0">

        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>

</style>