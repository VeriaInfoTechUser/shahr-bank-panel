<script setup>
import {ref, toRef} from "vue";
import {FormTextarea} from "@/base-components/Form";
import Lucide from "@/base-components/Lucide";
import avatar from "@/assets/images/avatar.png";
import {base_url, uri} from "@/constants/config.js";
import {getCookie} from "@/utils/cookie";
import {toast} from "vue3-toastify";
// import Dropzone from "@/base-components/Dropzone/index";
import BaseDialog from "@/base-components/Dialog/BaseDialog.vue";
import {useDownload} from "@/composables/useDownload.js";

const props = defineProps({
  conversation: {
    type: Object,
    default: []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  recipient: {
    type: Object,
    default: null
  },
  owner: {
    type: Object,
    default: null
  }
})
const chatBox = ref(false);
const showChatAttachmentFormFlag = ref(false)
const attachment = ref(null)
const loading = toRef(props, 'isLoading');
const hasAttachment = ref(false)
const isInLoadingUpload = ref(false)
const loadingMap = ref({});
const defaultMessage = {
  text: null,
  owner: null,
  attachment: null
}
const message = ref({
  text: null,
  owner: null,
  attachment: null
})
const emit = defineEmits(['send']);

function setShowChatAttachmentFormFlag(value) {
  if (value) {
    hasAttachment.value = false
    isInLoadingUpload.value = true
  }
  showChatAttachmentFormFlag.value = value;
}

function close() {
  attachment.value = null
  hasAttachment.value = false
  isInLoadingUpload.value = false
  setShowChatAttachmentFormFlag(false)
}

function removeAttachment() {
  isInLoadingUpload.value = false
  hasAttachment.value = false
  attachment.value = null
}

function sendMessage() {
  if (message.value.text || attachment.value) {
    message.value.attachment = attachment.value
    emit('send',
        {
          text: message.value.text,
          attachment: attachment.value
        }
    );
    Object.assign(message.value, defaultMessage)
    attachment.value = null
    isInLoadingUpload.value = false
    hasAttachment.value = false
  }
}

const downloadFile = async (file) => {
  const {handleDownload, error, loading} = useDownload(file);
  if (typeof handleDownload === 'function') {
    loadingMap.value[file.id] = true;
    await handleDownload();
    loadingMap.value[file.id] = loading.value;
    if (error.value) {
      console.error("Download failed: ", error.value);
    }
  } else {
    console.error("handleDownload is not a function");
  }
};

</script>

<template>
  <div class="grid grid-cols-12 gap-2 mt-5 intro-y">
    <BaseDialog
        :open="showChatAttachmentFormFlag"
        :title="$t('title.choose-file')"
        @close="close"
        :size="'sm'"
    >
<!--      <Dropzone-->
<!--          refKey="dropzoneMultipleRef"-->
<!--          :options="{-->
<!--                    method: 'post',-->
<!--                    url: base_url + uri.admin.media.private.add,-->
<!--                    headers: {-->
<!--                      'token': getCookie('utn'),-->
<!--                    },-->
<!--                    thumbnailWidth: 150,-->
<!--                    addRemoveLinks: true,-->
<!--                    autoProcessQueue: true,-->
<!--                    parallelUploads: 1,-->
<!--                    uploadMultiple: false,-->
<!--                    maxFiles:1,-->
<!--                    maxFilesize: 50, // MB-->
<!--                    init: function() {-->
<!--                       this.on('sending', function(file, xhr, formData) {-->
<!--                        });-->
<!--                        this.on('success', function(file, response) {-->

<!--                          if(isInLoadingUpload){-->
<!--                            attachment =response.data-->
<!--                            hasAttachment = true-->
<!--                            setShowChatAttachmentFormFlag(false)-->
<!--                          }-->
<!--                            this.removeAllFiles()-->
<!--                        });-->
<!--                        this.on('error', function(file, response) {-->
<!--                           toast(response.error.message, {-->
<!--                            theme: 'auto',-->
<!--                                type: 'error',-->
<!--                                dangerouslyHTMLString: true-->
<!--                            });-->
<!--                        });-->
<!--                        this.on('complete', function(file) {-->
<!--                        });-->
<!--                    }-->
<!--                  }"-->
<!--          class="dropzone w-full"-->
<!--      >-->
<!--        <div class="text-lg font-medium">-->
<!--          Drop files here or click to upload.-->
<!--        </div>-->
<!--        <div class="text-gray-600">-->
<!--          This is just a demo dropzone. Selected files are-->
<!--          <span class="font-medium">not</span> actually uploaded.-->
<!--        </div>-->
<!--      </Dropzone>-->
    </BaseDialog>

    <!-- BEGIN: Chat Content -->
    <div class="col-span-12 intro-y ">
      <div class="h-[782px] box">
        <!-- BEGIN: Chat Active -->
        <div class="flex flex-col h-full">
          <div
              class="flex flex-col px-5 py-1 border-b sm:flex-row border-slate-200/60 dark:border-darkmode-400"
          >
            <div class="flex items-center">
              <div
                  class="relative flex-none w-10 h-10 sm:w-12 sm:h-12 image-fit"
              >
                <img
                    alt=""
                    class="rounded-full w-8 h-8"
                    :src="recipient.avatar??avatar"
                />
              </div>
              <div class="ms-3 me-auto">
                <div class="text-sm font-medium">
                  {{ recipient.name }}
                </div>
                <div class="text-xs text-slate-500 ">
                  {{ recipient.email }}
                </div>
              </div>
            </div>
            <div
                class="flex items-center px-5 pt-3 mt-5 -mx-5 border-t sm:ms-auto sm:mt-0 sm:border-0 border-slate-200/60 sm:pt-0 sm:mx-0 sm:px-0"
            >
              <a href="#" class="w-8 h-8 text-primary">
                <Lucide icon="MessageSquare" class="w-8 h-8"/>
              </a>
            </div>
          </div>
          <div class="flex-1 px-5 pt-5 overflow-y-scroll scrollbar-hidden">


            <div
                v-for="(chat, index) in conversation"
                :key="index"
                class="flex w-full relative"
            >
              <!-- Owner's message -->
              <div
                  class="flex items-end ms-auto mb-4 max-w-[90%] sm:max-w-[49%]"
                  v-if="owner.id === conversation[index].owner_account.id"
              >

                <div>
                  <div v-if="chat.conversation_message.attachment " class="cursor-pointer"
                       @click="downloadFile(chat.conversation_message.attachment)"
                  >
                    <div class="border-[1px] m-1 rounded-full p-2   shadow-sm shadow-primary">
                      <Lucide icon="Download" class="w-4 h-4 text-primary"/>
                    </div>
                  </div>
                </div>
                <div class="px-4 py-3 text-white bg-primary rounded-l-md rounded-t-md">
                  {{ conversation[index].conversation_message.text }}
                  <div class="mt-1 text-[9px] text-white text-opacity-80">
                    {{ conversation[index].time_update_view }}
                  </div>
                </div>

                <div class="relative flex-none hidden w-10 h-10 ms-5 sm:block image-fit">
                  <img
                      :alt="conversation[index].owner_account.name"
                      class="rounded-full"
                      :src="conversation[index].owner_account.avatar ?? avatar"
                  />
                </div>
              </div>

              <!-- Other's message -->
              <div
                  v-else
                  class="flex items-end mb-4 max-w-[90%] sm:max-w-[49%]"
              >
                <div class="relative flex-none hidden w-10 h-10 me-5 sm:block image-fit">
                  <div>
                  <img
                      :alt="conversation[index].owner_account.name"
                      class="rounded-full w-10 h-10"
                      :src="conversation[index].owner_account.avatar ?? avatar"
                  />
                  </div>
                  <div>
                  <span class="text-[11px] font-medium text-primary">
                    {{ conversation[index].owner_account.name }}
                  </span>
                  </div>
                </div>

                <div class="px-4 py-3 bg-slate-100 dark:bg-darkmode-400 text-slate-800 rounded-r-md rounded-t-md">
                  {{ conversation[index].conversation_message.text }}
                  <div class="mt-1 text-[9px] text-slate-500 text-opacity-80">
                    {{ conversation[index].time_update_view }}
                  </div>
                </div>


                <div>
                  <div v-if="chat.conversation_message.attachment " class="cursor-pointer"
                       @click="downloadFile(chat.conversation_message.attachment)"
                  >
                    <div class="border-[1px] m-1 rounded-full p-2   shadow-sm shadow-primary"

                    >
                      <Lucide icon="Download" class="w-4 h-4 text-primary"/>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!--            <div class="clear-both" v-if="conversation[index].owner_account!==conversation[index+1].owner_account"></div>-->

          </div>
          <div v-if="loading">
            <FreeStyleShimmer height="60px" width="100%" border-radius="0px 0px 5px 5px"/>
          </div>
          <div
              v-else
              class="flex items-center pt-4 pb-10 border-t sm:py-4 border-slate-200/60 dark:border-darkmode-400"
          >
            <FormTextarea
                v-model="message.text"
                class="px-5 py-3 border-transparent shadow-none resize-none h-[46px] dark:bg-darkmode-600 focus:border-transparent focus:ring-0"
                :rows="1"
                :placeholder="$t('placeholder.type-message')"
            ></FormTextarea>
            <div v-if="hasAttachment">
              <div class="flex mx-3 shadow-primary shadow-sm rounded-md ">
                <div class=" ">
                  <Lucide icon="Paperclip" class="w-3 h-3 mx-1 my-2"/>
                </div>
                <div class="py-1 me-1">
                  {{ `${attachment.type}.${attachment.extension}` }}
                </div>
                <div class="border-red-50 w-8 bg-gray-100 rounded-e-md cursor-pointer" @click="removeAttachment">
                  <Lucide icon="Trash2" class="w-4 h-4 ms-2 mt-[7px] text-red-800"/>
                </div>
              </div>
            </div>
            <div v-else
                 class="absolute bottom-0 left-0 flex mb-5 ms-5 sm:static sm:ms-0 sm:mb-0"
            >
              <div
                  class="relative w-4 h-4 me-3 sm:w-5 sm:h-5 text-slate-500 sm:me-5 cursor-pointer"
                  @click="setShowChatAttachmentFormFlag(true)"
              >
                <Lucide icon="Paperclip" class="w-full h-full"/>
              </div>
            </div>
            <div>
            </div>
            <div
                @click="sendMessage"
                class="flex items-center cursor-pointer justify-center flex-none w-8 h-8 me-5 text-white rounded-full sm:w-10 sm:h-10 bg-primary"
            >
              <Lucide icon="Send" class="w-4 h-4"/>
            </div>
          </div>
        </div>
        <!-- END: Chat Active -->
        <!-- END: Chat Default -->
      </div>
    </div>
    <!-- END: Chat Content -->
  </div>
</template>
