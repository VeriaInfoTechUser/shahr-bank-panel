<script setup>
// import defaultAvatar from "@/assets/images/avatar.png";
import defaultAvatar from "@/assets/images/account-avatar-icon.svg";
import {storeToRefs} from "pinia";
import {useUserStore} from "@/stores/user";
import ProfileLoading from "@/pages/app/account/ProfileLoading.vue";
import {useLogout} from "@/composables/useLogout.js";
import Button from "@/base-components/Button";
import router from "@/router/index";
import Lucide from "@/base-components/Lucide";
import UploadAvatarDialog from "@/pages/app/account/profile/UploadAvatarDialog.vue";
import {ref} from "vue";
const props = defineProps({
  currentTap: {type: String, default: null},
})
const userStore = useUserStore()
const user = userStore.currentUser
const {updateProcessing} = storeToRefs(userStore);


const uploadDocumentModalId = "upload_document_modal";
const showUploadDocumentModalFlag = ref(false)

function showUploadDocumentModal() {
  showUploadDocumentModalFlag.value = true
}

function onSubmitUploadDocument(){
  userStore.updateProfileState()
  showUploadDocumentModalFlag.value =false
}

function resetUploadDocumentData(){

}

</script>

<template>
  <div>

    <div
        v-if="showUploadDocumentModalFlag"
    >
      <!--  modal of upload document  -->
      <UploadAvatarDialog
          @close="showUploadDocumentModalFlag = false"
          @onSubmitUploadDocument="onSubmitUploadDocument"
          :show="showUploadDocumentModalFlag"
      />
    </div>

    <div class="border-b border-gray:50">
      <ProfileLoading v-if="updateProcessing"/>
      <div class="px-3 py-5 lg:py-5 md:py-5 xl:py-5 intro-y box" v-else>
        <div class="flex flex-col lg:flex-row border-slate-200/60">
          <div>
            <div class="flex items-center flex-1 px-3 justify-start">
              <div
                  class="relative flex-none w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 image-fit"
              >
                <img
                    alt="User Profile Image"
                    class="rounded-full"
                    :src="`${user.avatar!=null?user.avatar:defaultAvatar}?data=${Date.now()}`"
                />
                <div
                    class="absolute bottom-0 right-0 flex items-center justify-center p-2 mb-1 mr-1 rounded-full bg-primary text-white"
                    @click="showUploadDocumentModal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                       stroke="currentColor" class="size-4">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"/>
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"/>
                  </svg>
                </div>
              </div>
              <div class="ml-5">
                <div
                    class="w-24 text-lg font-medium truncate sm:w-40 sm:whitespace-normal"
                >
                  {{ user.name }}
                </div>
                <div class="text-slate-500">{{ user.email }}</div>
              </div>
            </div>
          </div>
          <div
              class="flex-1 px-3 pt-5 mt-6 border-t border-s lg:my-0  md:my-0  xl:my-0 border-slate-200/60 lg:border-t-0 lg:py-0 md:py-0 xl:py-0"
          >
            <div class="md:flex lg:flex xl:flex">
              <div
                  class="flex flex-col justify-center items-start "
              >
                <div class="flex items-center mt-3 truncate sm:whitespace-normal">
                  <div class="min-w-20 me-1 text-sm truncate">
                    {{ $t('label.first-name') }}
                  </div>
                  <span>
                  {{ user.first_name }}
                </span>
                </div>
                <div class="flex items-center mt-3 truncate sm:whitespace-normal">
                  <div class="min-w-20 me-1 text-sm truncate">
                    {{ $t('label.last-name') }}
                  </div>
                  <span>
                  {{ user.last_name }}
                </span>
                </div>
                <div class="flex items-center mt-3 truncate sm:whitespace-normal">
                  <div class="min-w-20 me-1 text-sm  ">
                    {{ $t('label.roles') }}
                  </div>
                  <div class="max-w-96">
                     <span class="text-xs">
                        {{ user.roles?(user.roles.toString()).replaceAll(',', ', '):'' }}
                      </span>
                  </div>
                </div>
              </div>
              <div class="relative w-full mt-10 bottom-0 items-end justify-items-center">
                <div class="absolute bottom-0 lg:end-0 flex lg:flex-wrap sm:bh-flex-wrap md:flex-wrap gap-2">
                  <Button :variant="currentTap==='edit'?'primary':'outline-primary'" size="sm"
                          @click="router.push({name: 'app-account-edit'})">
                    <div class="flex">
                      <Lucide icon="Edit" class="w-4 h-4 mr-2 mt-1"/>
                      <span class="p-1">
                        {{ $t("button.edit") }}
                     </span>
                    </div>
                  </Button>

                  <Button :variant="currentTap==='password'?'primary':'outline-primary'" size="sm"
                          @click="router.push({name: 'app-account-password'})">
                    <div class="flex">
                      <Lucide icon="Lock" class="w-4 h-4 mr-2 mt-1"/>
                      <span class="p-1">
                        {{ $t("button.password") }}
                     </span>
                    </div>
                  </Button>

                  <Button variant="outline-primary" size="sm" @click="useLogout">
                    <div class="flex">
                      <Lucide icon="ToggleRight" class="w-4 h-4 mr-2 mt-1"/>
                      <span class="p-1">
                        {{ $t("button.logout") }}
                     </span>
                    </div>
                  </Button>

                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>

</style>