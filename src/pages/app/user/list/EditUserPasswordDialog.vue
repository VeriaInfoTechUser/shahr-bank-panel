<script setup>
import {Form} from "vee-validate";
import Button from "@/base-components/Button/index";
import BaseDialog from "@/base-components/Dialog/BaseDialog.vue";
import {FormLabel} from "@/base-components/Form/index";
import { ref, watch } from "vue";
import { toast } from "vue3-toastify";
import { userRepo } from "@/core/repositories/userRepo";
import {object} from "yup";
import useValidate from "@/composables/useValidate";
import InputText from "@/base-components/Form/InputText.vue";
import Lucide from "@/base-components/Lucide";

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  data: Object,
})
const emit = defineEmits(['close', 'onSuccess']);
const updateParams = ref({
  user_id: props.data?.id ?? -1,
  credential: null,
  retype: null,
})

watch(() => props.data, (data) => {
  if (data) {
    updateParams.value = {
      user_id: data.id ?? -1,
      credential: null,
      retype: null,
    };
  }
}, { deep: true })
const isLoading = ref(false);
const validationSchema = object(
    useValidate(['password', 'verify_password'])
);

function setIsLoading(value) {
  isLoading.value = value;
}

function close() {
  emit('close')
}

function onSuccess() {
  emit('onSuccess')
}

async function onSubmitEditUserPassword() {
  setIsLoading(true);
  try {
    const result = await userRepo.updateUserPassword(updateParams.value);
    if (result?.result) {
      emit('onSuccess');
      emit('close');
    } else {
      toast(result?.error?.message || 'خطا در تغییر رمز عبور', {
        theme: "auto",
        type: "error",
        dangerouslyHTMLString: true
      });
    }
  } catch (err) {
    toast((err && err.message) || 'خطا در تغییر رمز عبور', {
      theme: "auto",
      type: "error",
      dangerouslyHTMLString: true
    });
  } finally {
    isLoading.value = false;
  }
}

const togglePasswordViewFlag = ref(true)
const toggleRetypePasswordViewFlag = ref(true)

function togglePasswordView(){
  togglePasswordViewFlag.value = !togglePasswordViewFlag.value
}

function toggleRetypePasswordView(){
  toggleRetypePasswordViewFlag.value = !toggleRetypePasswordViewFlag.value
}

</script>

<template>
  <BaseDialog
      :size="'xl'"
      staticBackdrop
      :open="show"
      :has-footer="true"
      :title="$t('title.update-password')"
      @close="close"
  >

    <div class="rounded-md px-2 py-2 w-full max-h-[78vh] overflow-auto pb-8">
      <Form id="editUserPasswordForm" :validation-schema="validationSchema" @submit="onSubmitEditUserPassword">
        <input type="password" class="hidden"/>
        <div class="px-2">
          <div class="grid grid-cols-12 gap-4 mt-5 gap-y-5"  >
            <div class="col-span-12 intro-y sm:col-span-6">
              <FormLabel htmlFor="input-wizard-3">
                {{ $t('label.password') }}
              </FormLabel>
              <div class="relative flex mx-auto">
                <div
                    class="cursor-pointer flex items-center ms-2 h-[38px] justify-center w-10 border rounded-l bg-slate-100 text-slate-500 dark:bg-darkmode-700 dark:border-darkmode-800 dark:text-slate-400"
                    @click="togglePasswordView"
                >
                  <Lucide :icon="togglePasswordViewFlag?'Eye':'EyeOff'" class="w-4 h-3 text-black"/>
                </div>
                <InputText
                    class="w-full"
                    name="password"
                    v-model="updateParams.credential"
                    id="input-wizard-3"
                    :type="togglePasswordViewFlag?'password':'text'"
                />
              </div>
            </div>
            <div class="col-span-12 intro-y sm:col-span-6">
              <FormLabel htmlFor="input-wizard-3">
                {{ $t('label.retype-password') }}
              </FormLabel>
              <div class="relative flex mx-auto">
                <div
                    class="cursor-pointer   flex items-center h-[38px] justify-center w-10 border rounded-l bg-slate-100 text-slate-500 dark:bg-darkmode-700 dark:border-darkmode-800 dark:text-slate-400"
                    @click="toggleRetypePasswordView"
                >
                  <Lucide :icon="toggleRetypePasswordViewFlag?'Eye':'EyeOff'" class="w-4 h-3 text-black"/>
                </div>
                <InputText
                    class="w-full"
                    name="verify_password"
                    id="input-wizard-3"
                    v-model="updateParams.retype"
                    :type="toggleRetypePasswordViewFlag?'password':'text'"
                />
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
    <template v-slot:footer>
      <FreeStyleShimmer class="py-3" height="10px" width="100%" v-if="isLoading"/>
      <div class="flex col-md-12 items-end justify-end gap-2" v-else>
        <Button variant="outline-secondary" @click="close" size="sm" class=" shadow-md justify-end items-end">
          {{ $t('button.cancel') }}
        </Button>
        <Button variant="primary" size="sm" form="editUserPasswordForm" class=" shadow-md justify-end items-end">
          {{ $t('button.update-password') }}
        </Button>
      </div>
    </template>

  </BaseDialog>
</template>

<style scoped>

</style>