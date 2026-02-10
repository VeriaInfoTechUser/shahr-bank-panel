<script setup>
import BaseDialog from "@/base-components/Dialog/BaseDialog.vue";
import Button from "@/base-components/Button";
import {orderStatusList} from "@/utils/variables";
import {base_url, uri} from "@/constants/config";
import {getCookie} from "@/utils/cookie";
import {toast} from "vue3-toastify";
import InputText from "@/base-components/Form/InputText.vue";
import BaseCard from "@/base-components/Card/BaseCard.vue";
import Dropzone from "@/base-components/Dropzone";
import {Form} from "vee-validate";
import {FormLabel, FormSwitch, FormTextarea} from "@/base-components/Form";
import Lucide from "@/base-components/Lucide";
import BaseInputSelect from "@/base-components/Form/BaseInputSelect.vue";
import Litepicker from "@/base-components/Litepicker";
import {onMounted, ref} from "vue";
import {object} from "yup";
import {generateUniqueInt} from "@/composables/utility";
import {useFetch} from "@/composables/useFetch";
import useValidate from "@/composables/useValidate.js";
import {useUserStore} from "@/stores/user.js";

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  message:{
    type:Object,
    required:true
  }
})

const emit = defineEmits(['close'])

function close(){
  emit('close')
}
</script>

<template>
  <section>
    <BaseDialog
        :size="'w-[95vw]'"
        staticBackdrop
        :open="show"
        :has-footer="true"
        :title="$t('title.detail')"
        @close="close"
    >
      <div class="rounded-md px-5 py-3 w-full max-h-[78vh] overflow-auto">
         <h3 class="text-base font-medium text-gray-900">
           {{message.title}}
         </h3>
        <div class="text-xs text-gray-500">
          <span class="text-sm text-gray-500">
            {{message.time_create_view}}
          </span>
        </div>
        <div class="px-2 py-6">
          <p class="text-base leading-10">
            {{message.description}}
          </p>
        </div>

      </div>

      <template v-slot:footer>
        <div class="flex col-md-12 items-end justify-end gap-2">
          <Button variant="outline-secondary" @click="close" size="sm" class=" shadow-md justify-end items-end">
            {{ $t('button.close') }}
          </Button>
        </div>
      </template>

    </BaseDialog>
  </section>
</template>

<style scoped>

</style>