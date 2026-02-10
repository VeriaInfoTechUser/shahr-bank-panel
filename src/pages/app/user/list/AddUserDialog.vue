<script setup>
import {Form} from "vee-validate";
import Button from "@/base-components/Button/index";
import BaseDialog from "@/base-components/Dialog/BaseDialog.vue";
import {FormLabel, FormSwitch} from "@/base-components/Form/index";
import BaseInputSelect from "@/base-components/Form/BaseInputSelect.vue";
import {ref} from "vue";
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
  rolesList: Array
})
const emit = defineEmits(['close', 'onSuccess']);
const isOtp = ref(false);
const userParams = ref({
  identity: null,
  first_name: null,
  last_name: null,
  status: true,
  email: null,
  credential: null,
  retype_credential: null,
  mobil: null,
  roles: null
})
const isLoading = ref(false);
const validationSchemaViaOtp = object(useValidate(['identity', 'first_name', 'last_name', 'email', 'mobile']));
const validationSchemaViaPassword = object(useValidate(['identity', 'last_name', 'email', 'password', 'verify_password', 'mobile']),);
const togglePasswordViewFlag = ref(true)
const toggleRetypePasswordViewFlag = ref(true)

function setIsLoading(value) {
  isLoading.value = value;
}

function close() {
  emit('close')
}

function onSuccess() {
  emit('onSuccess')
}

async function onSubmitAddUser() {
  setIsLoading(true);
  try {
    const requestParams = { ...userParams.value };
    if (requestParams.roles) {
      requestParams.roles = requestParams.roles.map(({ name }) => name).join(',');
    } else {
      requestParams.roles = "";
    }
    requestParams.status = requestParams.status ? 1 : 0;

    const result = await userRepo.addUser(requestParams);
    if (result?.result) {
      setTimeout(() => {
        isLoading.value = false;
        emit('onSuccess');
        emit('close');
      }, 1000);
    } else {
      toast(result?.error?.message || 'خطا در افزودن کاربر', {
        theme: "auto",
        type: "error",
        dangerouslyHTMLString: true
      });
      isLoading.value = false;
    }
  } catch (err) {
    toast((err && err.message) || 'خطا در افزودن کاربر', {
      theme: "auto",
      type: "error",
      dangerouslyHTMLString: true
    });
    isLoading.value = false;
  }
}

function togglePasswordView() {
  togglePasswordViewFlag.value = !togglePasswordViewFlag.value
}

function toggleRetypePasswordView() {
  toggleRetypePasswordViewFlag.value = !toggleRetypePasswordViewFlag.value
}

</script>

<template>
  <BaseDialog
      :size="'xl'"
      staticBackdrop
      :open="show"
      :has-footer="true"
      :title="$t('title.add-user')"
      @close="close"
  >

    <div class="rounded-md px-2 py-2 w-full max-h-[78vh] overflow-auto pb-8">
      <Form id="addUserForm" :validation-schema="isOtp?validationSchemaViaOtp:validationSchemaViaPassword"
            @submit="onSubmitAddUser">
        <input type="password" class="hidden"/>
        <input type="text" name="username" class="hidden"/>
        <input type="text" name="mobile" class="hidden"/>
        <input type="text" name="email" class="hidden"/>
        <div class="px-2">
          <ParagraphShimmer :lines="5" :is-loading="isLoading"/>
          <div class="grid grid-cols-12 gap-4 mt-5 gap-y-5" v-if="!isLoading">

            <div class="col-span-12 intro-y sm:col-span-12">
              <FormLabel htmlFor="input-wizard-3">
                {{ $t('label.identity') }}
              </FormLabel>
              <InputText
                  name="identity"
                  v-model="userParams.identity"
                  id="input-wizard-3"
                  type="text"
              />
            </div>
            <div class="col-span-12 intro-y sm:col-span-6">
              <FormLabel htmlFor="input-wizard-3">
                {{ $t('label.first-name') }}
              </FormLabel>
              <InputText
                  name="first_name"
                  v-model="userParams.first_name"
                  id="input-wizard-3"
                  type="text"
              />
            </div>
            <div class="col-span-12 intro-y sm:col-span-6">
              <FormLabel htmlFor="input-wizard-3">
                {{ $t('label.last-name') }}
              </FormLabel>
              <InputText
                  name="last_name"
                  v-model="userParams.last_name"
                  id="input-wizard-3"
                  type="text"
              />
            </div>

            <div class="col-span-12 intro-y sm:col-span-6">
              <FormLabel htmlFor="input-wizard-3">
                {{ $t('label.email') }}
              </FormLabel>
              <InputText
                  name="email"
                  v-model="userParams.email"
                  id="input-wizard-3"
                  type="text"
              />
            </div>
            <div class="col-span-12 intro-y sm:col-span-6">
              <FormLabel htmlFor="input-wizard-3">
                {{ $t('label.mobile') }}
              </FormLabel>
              <InputText
                  name="mobile"
                  v-model="userParams.mobile"
                  id="input-wizard-3"
                  type="text"
              />
            </div>

            <div class="border-y col-span-12 grid grid-cols-12 py-3 border-slate-50">
              <div class="col-span-12 intro-y sm:col-span-6">
                <FormLabel htmlFor="input-wizard-3">
                  {{ $t('label.status') }}
                </FormLabel>
                <div class="flex gap-3 ">
                  <div :class="{'text-slate-300 font-think':userParams.status}">
                    {{ $t('title.inactive') }}
                  </div>
                  <FormSwitch class="flex flex-row items-start">
                    <FormSwitch.Input id="post-form-6" type="checkbox" class="xs" v-model="userParams.status"/>
                  </FormSwitch>
                  <div :class="{'text-slate-300 font-think':!userParams.status}">
                    {{ $t('title.active') }}
                  </div>
                </div>
              </div>
              <div class="col-span-12 intro-y sm:col-span-6">
                <FormLabel htmlFor="input-wizard-3">
                  {{ $t('label.credential-type') }}
                </FormLabel>
                <div class="flex gap-3 ">
                  <div :class="{'text-slate-300 font-think':isOtp}">
                    {{ $t('title.password') }}
                  </div>
                  <FormSwitch class="flex flex-row items-start">
                    <FormSwitch.Input id="post-form-6" type="checkbox" class="xs" v-model="isOtp"/>
                  </FormSwitch>
                  <div :class="{'text-slate-300 font-think':!isOtp}">
                    {{ $t('title.otp') }}
                  </div>
                </div>
              </div>
            </div>


            <div class="col-span-12 grid grid-cols-12" v-if="!isOtp">
              <div class="col-span-12 intro-y sm:col-span-6 pe-2">
                <FormLabel htmlFor="input-wizard-3">
                  {{ $t('label.password') }}
                </FormLabel>
                <div class="relative flex mx-auto">
                  <div
                      class="cursor-pointer flex items-center h-[38px] justify-center w-10 border rounded-l bg-slate-100 text-slate-500 dark:bg-darkmode-700 dark:border-darkmode-800 dark:text-slate-400"
                      @click="togglePasswordView"
                  >
                    <Lucide :icon="togglePasswordViewFlag?'Eye':'EyeOff'" class="w-4 h-3 text-black"/>
                  </div>
                  <InputText
                      class="w-full"
                      name="password"
                      v-model="userParams.credential"
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
                      v-model="userParams.retype_credential"
                      :type="toggleRetypePasswordViewFlag?'password':'text'"
                  />
                </div>
              </div>
            </div>

            <div class="col-span-12  ">
              <FormLabel htmlFor="input-wizard-3">
                {{ $t('label.roles') }}
              </FormLabel>
              <BaseInputSelect
                  :is-preselect-first="true"
                  v-model="userParams.roles"
                  name="name"
                  deselect-label=""
                  :is-multiple="true"
                  track-by="name"
                  label="title"
                  :options="rolesList"
                  :searchable="false"
                  :allow-empty="false"
              >
              </BaseInputSelect>
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
        <Button variant="primary" size="sm" form="addUserForm" class=" shadow-md justify-end items-end">
          {{ $t('button.add-user') }}
        </Button>
      </div>
    </template>

  </BaseDialog>
</template>

<style scoped>

</style>