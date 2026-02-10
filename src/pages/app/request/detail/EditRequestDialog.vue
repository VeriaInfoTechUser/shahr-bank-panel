<script setup>
import {Form} from "vee-validate";
import Button from "@/base-components/Button/index";
import BaseDialog from "@/base-components/Dialog/BaseDialog.vue";
import {orderStatusList} from "@/utils/variables";
import Litepicker from "@/base-components/Litepicker/index";
import {FormLabel, FormTextarea} from "@/base-components/Form/index";
import BaseInputSelect from "@/base-components/Form/BaseInputSelect.vue";
import BaseCard from "@/base-components/Card/BaseCard.vue";
import Lucide from "@/base-components/Lucide/index";
import {ref} from "vue";
import Dropzone from "@/base-components/Dropzone/index";
import {base_url, uri} from "@/constants/config";
import {getCookie} from "@/utils/cookie";
import {toast} from "vue3-toastify";
import {useFetch} from "@/composables/useFetch.js";

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  data: Object
})
const emit = defineEmits(['close', 'onSuccess']);
const dateFormat = "YYYY-MM-DD";
const updateParams = ref({
  id:  props.data.id??-1,
  edit_type:'admin_request_history',
  slug:  props.data.slug??'',
  follow_up_date: props.data.follow_up_date ? props.data.follow_up_date : "",
  comment: null,
  attachments:[],
  order_status: props.data.order ? props.data.order.order_status :
      {value: null, label:null},
  old_values:{
    id:  props.data.id??-1,
    slug:  props.data.slug??'',
    follow_up_date: props.data.follow_up_date ? props.data.follow_up_date : "",
    comment: null,
    attachments:[],
    order_status: props.data.order ? props.data.order.order_status :
        {value: null, label: null},
  }
})
const isLoading = ref(false);

function setIsLoading(value){
  isLoading.value = value;
}
function close() {
  emit('close')
}

function onSuccess() {
  emit('onSuccess')
}

async function onSubmitEditRequest() {
  setIsLoading(true)
  const result = await useFetch(uri.admin.request.edit, {body: updateParams.value});
  if (result.data.result) {
    console.log(result.data);
    isLoading.value = false
    emit('onSuccess')
    emit('close')
  } else {
    toast(result.data.error.message, {
      theme: "auto",
      type: "error",
      dangerouslyHTMLString: true
    });
    isLoading.value = false
  }
}

</script>

<template>
  <BaseDialog
      :size="'xl'"
      staticBackdrop
      :open="show"
      :has-footer="true"
      :title="$t('title.edit-request')"
      @close="close"
  >
    <div class="rounded-md px-2 py-2 w-full max-h-[78vh] overflow-auto">
      <Form id="editRequestForm" @submit="onSubmitEditRequest" >
        <div class="grid grid-cols-12 gap-4">

          <BaseCard
              class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12"
          >
            <template v-slot:body>
              <div class="grid grid-cols-12 gap-4 mt-5 gap-y-5">

                <div class="col-span-12 intro-y sm:col-span-6">
                  <FormLabel htmlFor="input-wizard-3">
                    {{ $t('label.follow-up-date') }}
                  </FormLabel>
                  <div class="relative mx-auto">
                    <div
                        class="absolute flex items-center justify-center w-10 h-full border rounded-l bg-slate-100 text-slate-500 dark:bg-darkmode-700 dark:border-darkmode-800 dark:text-slate-400"
                    >
                      <Lucide icon="Calendar" class="w-4 h-4"/>
                    </div>
                    <Litepicker
                        v-model="updateParams.follow_up_date"
                        :options="{
                    autoApply: true,
                    format: dateFormat,
                    showWeekNumbers: true,
                    dropdowns: {
                      minYear: 1990,
                      maxYear: null,
                      months: true,
                      years: true,
                    },
                  }"
                        class="pl-12"
                    />
                  </div>
                </div>

                <div class="col-span-12 intro-y sm:col-span-6">
                  <FormLabel htmlFor="input-wizard-3">
                    {{ $t('label.request-status') }}
                  </FormLabel>
                  <BaseInputSelect
                      class="primary"
                      v-model="updateParams.order_status"
                      name="value"
                      deselect-label=""
                      :is-multiple="false"
                      track-by="value"
                      label="label"
                      :placeholder="$t('placeholder.request-status')"
                      :options="orderStatusList??[]"
                      :searchable="false"
                      :allow-empty="false"
                      :is-preselect-first="false"
                  >
                  </BaseInputSelect>
                </div>

                <div class="col-span-12 intro-y sm:col-span-12">
                  <FormLabel htmlFor="product_description">
                    {{ $t('label.comment') }}
                  </FormLabel>
                  <FormTextarea
                      id="validation-form-6"
                      v-model="updateParams.comment"
                      rows="5"
                      name="description"
                      :placeholder="$t('placeholder.description')"
                  ></FormTextarea>
                </div>

                <div class="col-span-12 intro-y sm:col-span-12">
                  <Dropzone
                      refKey="dropzoneMultipleRef"
                      :options="{
                    method: 'post',
                    url: base_url + uri.api.media.private.add,
                    headers: {
                      'token': getCookie('utn'),
                    },
                    thumbnailWidth: 150,
                    addRemoveLinks: true,
                    autoProcessQueue: true,
                    parallelUploads: 1,
                    uploadMultiple: false,
                    maxFilesize: 50, // MB
                    init: function() {
                       this.on('sending', function(file, xhr, formData) {
                        });
                        this.on('success', function(file, response) {
                           updateParams.attachments.push(response.data)
                        });
                        this.on('error', function(file, response) {
                           toast(response.error.message, {
                            theme: 'auto',
                                type: 'error',
                                dangerouslyHTMLString: true
                            });
                        });
                        this.on('complete', function(file) {
                        });
                    }
                  }"
                      class="dropzone w-full"
                  >
                    <div class="text-lg font-medium">
                      Drop files here or click to upload.
                    </div>
                    <div class="text-gray-600">
                      This is just a demo dropzone. Selected files are
                      <span class="font-medium">not</span> actually uploaded.
                    </div>
                  </Dropzone>
                </div>

              </div>
            </template>
          </BaseCard>

        </div>
      </Form>
    </div>

    <template v-slot:footer>
      <FreeStyleShimmer class="py-3" height="10px" width="100%" v-if="isLoading"/>
      <div class="flex col-md-12 items-end justify-end gap-2" v-else>
        <Button variant="outline-secondary" @click="close" size="sm" class=" shadow-md justify-end items-end">
          {{ $t('button.cancel') }}
        </Button>
        <Button variant="primary" size="sm" form="editRequestForm" class=" shadow-md justify-end items-end">
          {{ $t('button.edit-request') }}
        </Button>
      </div>
    </template>

  </BaseDialog>
</template>

<style scoped>

</style>