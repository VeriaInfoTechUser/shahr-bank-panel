<script setup>
import Button from "@/base-components/Button/index";
import BaseDialog from "@/base-components/Dialog/BaseDialog.vue";
import Lucide from "@/base-components/Lucide/index";
import {ref} from "vue";
import {useDownload} from "@/composables/useDownload.js";

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  data: Object
})
const emit = defineEmits(['close']);
const loadingMap = ref({});

function close() {
  emit('close')
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
  <BaseDialog
      :size="'xl'"
      :open="show"
      :has-footer="true"
      :title="data.title"
      @close="close"
  >
    <div class="rounded-md px-2 py-2 w-full max-h-[78vh] overflow-auto">
      <div v-if="data.index===0">
        <div>
          <div>
            <div class="mb-3 text-base text-slate-500 flex gap-1">
              <Lucide icon="CalendarClock" class="w-5 h-5 text-primary"/>
              <span>
                  {{ data.time_create_view }}
                </span>
            </div>
            <div
                class="grid grid-cols-1 sm:grid-cols-1 lx:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 gap-1 border-b pb-2">
              <div class="text-xl font-semibold text-primary">
                  <span>
                     {{ data.order.order_status.label }}
                  </span>
                <span class="text-sm text-green-400" v-if="data.is_new_customer">
                    ( {{ $t('message.new-customer') }} )
                  </span>
              </div>
              <div class="text-base text-slate-700 items-end justify-end">
                <div class="items-end text-end pe-2">
                  {{ $t('title.follow-up-date') }}:
                  {{ data.follow_up_date }}
                </div>
              </div>
            </div>
            <div class="my-2" v-if="data.is_new_customer">
              <span class="text-sm text-gray-900">
                - {{ $t('message.registered-by-admin') }}
              </span>
            </div>
            <div class="my-2">
                <span class="text-sm text-gray-900">
                  - {{
                    data.send_from === 'admin' ? $t('message.request-from-admin') : $t('message.request-from-customer')
                  }}
                </span>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <div>
          <div class="mb-3  text-xs text-slate-500 flex gap-1">
              <span>
                 <Lucide icon="CalendarClock" class="w-4 h-4 text-primary"/>
              </span>
            <span>
                {{ data.time_update_view }}
              </span>
          </div>
          <div class="text-slate-500 text-xs">
            {{ $t('title.from') }} {{ data.old_values.order_status.label }} {{ $t('title.to') }}
          </div>
          <div class="text-base text-primary ps-3">
              <span class="text-xs">
               {{ data.order_status.label }}
              </span>
          </div>
          <hr/>
          <div class="text-slate-500 text-[10px] mt-2">
            {{ $t('title.from') }} {{ data.old_values.follow_up_date }} {{ $t('title.to') }}
          </div>
          <div class="ps-3 text-xs text-primary">
                    <span class="text-slate-500 text-[10px]">
                      {{ $t('title.follow-up-date') }} :
                    </span>
            <span class="text-sm">
                      {{ data.follow_up_date }}
                    </span>
          </div>
          <hr/>
          <div class="my-1 mb-2" v-if="data.comment">
            <p class="text-xs text-gray-900 text-ellipsis">
              {{ data.comment }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <template v-slot:footer>
      <div class="flex w-full h-8">
      <div class="flex col-md-12 items-start justify-start gap-2 w-full">
        <div v-if="data.index===0">
          <div v-if="data.order.attachments.length>0" class="cursor-default mt-5">
            <div class="mt-1 flex flex-wrap gap-3" v-for="file in data.order.attachments" :key="file.id">
              <Button
                  variant="outline-secondary"
                  size="sm"
                  class="mb-2 me-2"
                  @click="downloadFile(file)"
                  :disabled="loadingMap[file.id]"
              >
                <Lucide icon="Download" class="w-4 h-4 mx-1 text-black"/>
                {{ file.type }}.{{ file.extension }}
              </Button>
            </div>
          </div>
        </div>
        <div v-else>
          <div v-if="data.attachments.length>0& data.index>0">
            <div class="mt-1 flex flex-wrap gap-3" v-for="file in data.attachments" :key="file.id"
                 style="display: inline-flex!important;">
              <Button
                  variant="outline-secondary"
                  size="sm"
                  class="mb-2 me-2"
                  @click="downloadFile(file)"
                  :disabled="loadingMap[file.id]"
              >
                <Lucide icon="Download" class="w-4 h-4 mx-1 text-black"/>
                {{ file.type }}.{{ file.extension }}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <Button variant="outline-secondary" @click="close" size="sm" class="mt-1 shadow-md justify-end items-end">
          {{ $t('button.cancel') }}
        </Button>
      </div>
      </div>
    </template>

  </BaseDialog>
</template>

<style scoped>

</style>