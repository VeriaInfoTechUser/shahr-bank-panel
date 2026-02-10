<script setup>
import BaseDialog from "@/base-components/Dialog/BaseDialog.vue";
import Button from "@/base-components/Button";
import { uri} from "@/constants/config";
import InputText from "@/base-components/Form/InputText.vue";
import {Form} from "vee-validate";
import {FormLabel} from "@/base-components/Form";
import BaseInputSelect from "@/base-components/Form/BaseInputSelect.vue";
import {onMounted, ref} from "vue";
import {object} from "yup";
import {useFetch} from "@/composables/useFetch";
import useValidate from "@/composables/useValidate.js";
import {useI18n} from "vue-i18n";
import InputTextarea from "@/base-components/Form/InputTextarea.vue";
import {useUserStore} from "@/stores/user.js";

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})
const {t: $t} = useI18n()
const emit = defineEmits(['close', 'onSuccess']);
const validationSchema = object(useValidate(['description', 'title']),);

function close() {
  emit('close')
}

function onSuccess() {

  try {

  } catch (error) {

  } finally {

  }
  emit('onSuccess')
}

const requestParams = ref({
  title: null,
  description: null,
  department: null
})
const slug = ref(null)
const data = null;
const date = "";
const isLoadingFlag = ref(false)

const userStore = useUserStore()
const user = userStore.currentUser
async function trySendTicket() {
  isLoadingFlag.value = true
  let body = {
    type:"public-message",
    is_open:true,
    title: requestParams.value.title,
    description: requestParams.value.description,
    send_from: 'admin',
    customer: {
      id: user.id ?? 0,
      email: user.email ?? '',
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      name: user.name ?? '',
      avatar: user.avatar ?? '',
    },
  }
  try {
    const {data, error} = await useFetch(`${uri.admin.support.message.send}`, {method: "post", body: body});
    if (data) {
      emit('onSuccess')
    }
  } catch (err) {
    console.log(err)
  }finally {
    isLoadingFlag.value = false
  }

}

</script>

<template>
  <section>
    <BaseDialog
        :size="'lg'"
        staticBackdrop
        :open="show"
        :has-footer="true"
        :title="$t('title.send-public-message')"
        @close="close"
    >
      <div class="rounded-md px-2 py-2 w-full max-h-[78vh] overflow-auto mb-5">
        <Form id="myForm" :validationSchema="validationSchema" @submit="trySendTicket">
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2">
              <FreeStyleShimmer height="38px" width="100%" class="mt-10"
                                v-if="isLoadingFlag"/>
              <InputText
                  v-else
                  name="title"
                  :has-label="true"
                  :label="$t('label.title')"
                  v-model="requestParams.title"
                  id="input-wizard-3"
                  type="text"
              />
            </div>
            <div class="col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2">

            </div>
            <div class="col-span-2">
              <div class="col-span-2 md:col-span-1 lg:col-span-1 xl:col-span-1">
                <FreeStyleShimmer height="100px" width="100%" class="mt-10"
                                  v-if="isLoadingFlag"/>
              <InputTextarea
                  v-else
                  :has-label="true"
                  :label="$t('label.description')"
                  id="validation-form-6"
                  v-model="requestParams.description"
                  :rows="'5'"
                  name="description"
                  :placeholder="''"
              ></InputTextarea>
              </div>
            </div>
          </div>
        </Form>
      </div>

      <template v-slot:footer>
        <div class="flex col-md-12 items-end justify-end gap-2">
          <Button variant="outline-secondary" @click="close" size="sm" class=" shadow-md justify-end items-end">
            {{ $t('button.cancel') }}
          </Button>
          <Button variant="primary" size="sm" form="myForm" class=" shadow-md justify-end items-end">
            {{ $t('button.send') }}
          </Button>
        </div>
      </template>

    </BaseDialog>
  </section>
</template>

<style scoped>

</style>