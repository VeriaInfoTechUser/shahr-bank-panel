<script setup>
import {Form} from "vee-validate";
import Button from "@/base-components/Button/index";
import BaseDialog from "@/base-components/Dialog/BaseDialog.vue";
import { FormLabel } from "@/base-components/Form/index";
import BaseInputSelect from "@/base-components/Form/BaseInputSelect.vue";
import BaseCard from "@/base-components/Card/BaseCard.vue";
import { ref, watch } from "vue";
import { toast } from "vue3-toastify";
import { userRepo } from "@/core/repositories/userRepo";
import {object} from "yup";
import useValidate from "@/composables/useValidate";
import InputText from "@/base-components/Form/InputText.vue";

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  data: Object,
  rolesList:Array
})
const emit = defineEmits(['close', 'onSuccess']);
const updateParams = ref({
  user_id: props.data?.id ?? -1,
  first_name: props.data?.first_name ?? null,
  last_name: props.data?.last_name ?? null,
  roles: props.data?.roles ?? [],
})

watch(() => props.data, (data) => {
  if (data) {
    updateParams.value = {
      user_id: data.id ?? -1,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      roles: data.roles ?? [],
    };
  }
}, { deep: true })
const isLoading = ref(false);
const validationSchema = object(
    useValidate(['first_name', 'last_name'])
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

async function onSubmitEditUser() {
  setIsLoading(true);
  try {
    const result = await userRepo.editUser(updateParams.value);
    if (result?.result) {
      emit('onSuccess');
      emit('close');
    } else {
      toast(result?.error?.message || 'خطا در ویرایش کاربر', {
        theme: "auto",
        type: "error",
        dangerouslyHTMLString: true
      });
    }
  } catch (err) {
    toast((err && err.message) || 'خطا در ویرایش کاربر', {
      theme: "auto",
      type: "error",
      dangerouslyHTMLString: true
    });
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <BaseDialog
      :size="'xl'"
      staticBackdrop
      :open="show"
      :has-footer="true"
      :title="$t('title.edit-user')"
      @close="close"
  >

    <div class="rounded-md px-2 py-2 w-full max-h-[78vh] overflow-auto pb-8">
      <Form id="editUserForm" :validation-schema="validationSchema" @submit="onSubmitEditUser">
        <div class="px-2">
          <div class="grid grid-cols-12 gap-4 mt-5 gap-y-5" >
            <div class="col-span-12 intro-y sm:col-span-6">
              <FormLabel htmlFor="input-wizard-3">
                {{ $t('label.first-name') }}
              </FormLabel>
              <InputText
                  name="first_name"
                  v-model="updateParams.first_name"
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
                  v-model="updateParams.last_name"
                  id="input-wizard-3"
                  type="text"
              />
            </div>
            <div class="col-span-12  ">
              <FormLabel htmlFor="input-wizard-3">
                {{ $t('label.roles') }}
              </FormLabel>
                  <BaseInputSelect
                      :is-preselect-first="true"
                      v-model="updateParams.roles"
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
      <FreeStyleShimmer class="py-3" height="10px" width="100%" v-if="isLoading"/>
      <div class="flex col-md-12 items-end justify-end gap-2" v-else>
        <Button variant="outline-secondary" @click="close" size="sm" class=" shadow-md justify-end items-end">
          {{ $t('button.cancel') }}
        </Button>
        <Button variant="primary" size="sm" form="editUserForm" class=" shadow-md justify-end items-end">
          {{ $t('button.edit-user') }}
        </Button>
      </div>
    </template>

  </BaseDialog>
</template>

<style scoped>

</style>