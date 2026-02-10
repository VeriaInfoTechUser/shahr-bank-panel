<script setup>

import {useRoute} from "vue-router"
import {onMounted, ref} from "vue"
import {useFetch} from "@/composables/useFetch.js"
import {uri} from "@/constants/config.js"
import {useI18n} from "vue-i18n";
import {getCurrentUser} from "@/utils/cookie.ts";
import ChatComponent from "@/pages/app/request/detail/ChatComponent.vue";

const route = useRoute()
const id = ref(route.params.id)
const loadingFlag = ref(true)
const isLoading = ref(true)
const ticketInformation = ref({})
const {t: $t} = useI18n()


// Fetch data when the component mounts
onMounted(getTicket);

const requestDetail = ref(null)
const user = getCurrentUser()
const requestTempDetail = ref(null)
async function getTicket() {
  isLoading.value = true
  const {data, error} = await useFetch(uri.admin.support.item.get, {body: {type: 'id', id: id.value}});
  if (data) {
    requestDetail.value = data.data
    requestTempDetail.value = data.data
  }
  isLoading.value = false
}


function sendMessage(message){
  // isSendMessageLoading.value=true
  console.log(message)
  sendMessageRequest(message)
}

const isSendMessageLoading = ref(false)
async function sendMessageRequest(message) {
  isSendMessageLoading.value = true
  const requestParams = {
    edit_type:'admin_request_chat',
    slug: requestDetail.value.slug,
    conversation_message : message
  }
  const result = await useFetch(uri.admin.support.item.edit, {body: requestParams});
  if (result.data.result) {
    requestDetail.value.conversation = result.data.data.conversation
  }
  isSendMessageLoading.value = false
}

</script>

<template>
  <!-- BEGIN: Ticket -->
  <div class="gap-3 mt-3 intro-y">
    <ChatComponent
        v-if="requestDetail"
        :is-loading="isSendMessageLoading"
        :conversation="requestDetail.conversation"
        :recipient="requestDetail.customer"
        :owner="user"
        @send="sendMessage"
    />
  </div>

</template>

<style scoped>

</style>