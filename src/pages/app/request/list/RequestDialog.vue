<script setup >
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

const props = defineProps({
  show:{
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close','onSuccess']);

function close(){
  emit('close')
}

function onSuccess(){
  emit('onSuccess')
}

const requestParams = ref({
  id: null,
  slug: null,
  follow_up_date: "",
  title: null,
  time_create_view: null,
  time_update_view: null,
  is_new_customer: null,
  send_from: 'admin',
  customer: {
    id: null,
    email: null,
    first_name: null,
    last_name: null,
    name: null,
    avatar: null
  },
  order: {
    product: {
      title: null,
      company: null,
      quantity: null,
      quantity_unit: null,
      description: null,
    },
    delivery: {
      country: null,
      state: null,
      city: null,
      zip_code: null,
      address: null,
      location: {
        lat: null,
        long: null,
      },
    },
    attachments: [],
    order_status: null
  }
})
const slug = ref(null)
const usersList = ref(null)
const userDataLoadingFlag = ref(true)
const data = null;
const isRegisteredCustomer = ref(true);
const date = "";
const customer = ref({
  id: null,
  email: null,
  first_name: null,
  last_name: null,
});
const dateFormat = "YYYY-MM-DD";
const isLoading = ref(false);
const validationSchema = object(
    useValidate(isRegisteredCustomer.value?
        ['title', 'subject', 'company','country','state','city','zip_code','quantity','quantity_unit'] :
        ['title', 'subject', 'first_name', 'last_name', 'company', 'email','country','state','city','zip_code','quantity','quantity_unit']
    ),
);

onMounted(async () => {
  slug.value = generateUniqueInt()
  await fetchUsersList();
});

function trySendRequest() {
  isLoading.value = true
  if (!isRegisteredCustomer.value) {
    registerUser()
  } else {
    Object.assign(requestParams.value.customer, customer.value);
    sendRequest();
  }
}


async function registerUser() {
  const rawData = {
    id: null,
    email: customer.value.email,
    first_name: customer.value.first_name,
    last_name: customer.value.last_name,
  };
  const result = await useFetch(uri.api.user.register, {body: rawData});
  if (result) {
    if (result.data.result) {
      console.log(result.data);
      requestParams.value.customer = result.data.data;
      await sendRequest();
    } else {
      toast(result.data.error.message, {
        theme: "auto",
        type: "error",
        dangerouslyHTMLString: true
      });
      isLoading.value = false
    }
  } else {
    isLoading.value = false
  }
}

async function sendRequest() {
  requestParams.value.is_new_customer = !isRegisteredCustomer.value
  requestParams.value.type = 'request'
  const result = await useFetch(uri.admin.request.add, {body: requestParams.value});
  if (result.data.result) {
    isLoading.value = false
    emit('onSuccess')
  } else {
    toast(result.data.error.message, {
      theme: "auto",
      type: "error",
      dangerouslyHTMLString: true
    });
    isLoading.value = false
  }
}

async function fetchUsersList() {
  const result = await useFetch(uri.admin.user.profile.list, {body: {limit: 1000}});
  if (result.data.result) {
    usersList.value = result.data.data.list
  }
  userDataLoadingFlag.value = false
}


</script>

<template>
  <section>
    <BaseDialog
        :size="'w-[95vw]'"
        staticBackdrop
        :open="show"
        :has-footer="true"
        :title="$t('title.add-request')"
        @close="close"
    >
      <div class="rounded-md px-2 py-2 w-full max-h-[78vh] overflow-auto">
        <Form id="myForm" :validation-schema="validationSchema" @submit="trySendRequest">
          <div class="grid grid-cols-12 gap-4">
            <!-- BEGIN: Subject Layout -->
            <BaseCard
                class="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6"
                :title="$t('title.request')"
            >
              <template v-slot:header>
                <div class="w-full flex items-end justify-end gap-4">
                  <div class="flex items-center text-slate-500">
              <span>
                <Lucide icon="Lightbulb" class="w-5 h-5 text-warning"/>
              </span>
                    <div class="ml-2">
                  <span class="mr-1">
                    {{ $t('description.enter-base-request-information') }}
                  </span>
                    </div>
                  </div>
                </div>
              </template>
              <template v-slot:body>
                <ParagraphShimmer :lines="5" :is-loading="isLoading"/>
                <div class="grid grid-cols-12 gap-4 mt-5 gap-y-5" v-if="!isLoading">
                  <div class="col-span-12 intro-y sm:col-span-12">
                    <FormLabel htmlFor="input-wizard-3">
                      {{ $t('label.subject') }}
                    </FormLabel>
                    <InputText
                        name="subject"
                        v-model="requestParams.title"
                        id="input-wizard-3"
                        type="text"
                        :placeholder="$t('placeholder.subject')"
                    />
                  </div>
                  <div class="col-span-12 intro-y sm:col-span-6">
                    <FormLabel htmlFor="input-wizard-3">
                      {{ $t('label.request-status') }}
                    </FormLabel>
                    <BaseInputSelect
                        class="primary"
                        v-model="requestParams.order.order_status"
                        name="value"
                        deselect-label=""
                        :is-multiple="false"
                        track-by="value"
                        label="label"
                        :placeholder="$t('placeholder.request-status')"
                        :options="orderStatusList??[]"
                        :searchable="false"
                        :allow-empty="false"
                        :is-preselect-first="true"
                    >
                    </BaseInputSelect>
                  </div>
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
                          v-model="requestParams.follow_up_date"
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
                </div>
              </template>
            </BaseCard>
            <!-- END: Subject Layout -->

            <!-- BEGIN: Customer Layout -->
            <BaseCard
                class="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6"
                :title="$t('title.customer')"
            >
              <template v-slot:header>
                <div class="w-full flex items-end justify-end">
          <span class="text-sm mb-1 mx-3">
            {{ $t('label.is-registered') }}
          </span>
                  <FreeStyleShimmer width="40px" height="20px" :is-loading="isLoading"/>
                  <FormSwitch class="flex flex-row items-start" v-if="!isLoading">
                    <FormSwitch.Input id="post-form-6" type="checkbox" class="xs" v-model="isRegisteredCustomer"/>
                  </FormSwitch>
                </div>
              </template>
              <template v-slot:body>
                <ParagraphShimmer :lines="4" :is-loading="isLoading"/>
                <div class="grid grid-cols-12 gap-4 mt-5 gap-y-5" v-if="!isLoading">
                  <div class="col-span-12 intro-y sm:col-span-12" v-if="isRegisteredCustomer">
                    <FormLabel htmlFor="user_email_input">
                      {{ $t('label.user') }}
                    </FormLabel>
                    <BaseInputSelect
                        class="primary"
                        v-model="customer"
                        name="id"
                        deselect-label=""
                        :is-multiple="false"
                        track-by="id"
                        label="email"
                        :placeholder="$t('placeholder.request-customer')"
                        :options="usersList??[]"
                        :searchable="true"
                        :allow-empty="false"
                        :is-preselect-first="false"
                    >
                    </BaseInputSelect>
                  </div>
                  <div class="col-span-12 intro-y sm:col-span-12" v-else>
                    <FormLabel htmlFor="user_email_input">
                      {{ $t('label.email') }}
                    </FormLabel>
                    <InputText
                        name="email"
                        id="user_email_input"
                        v-model="customer.email"
                        type="text"
                        :placeholder="$t('placeholder.email')"
                    />
                  </div>
                  <div class="col-span-12 intro-y sm:col-span-6">
                    <FormLabel htmlFor="user_first_name_input">
                      {{ $t('label.first-name') }}
                    </FormLabel>
                    <InputText
                        name="first_name"
                        id="user_first_name_input"
                        type="text"
                        :disabled="isRegisteredCustomer"
                        v-model="customer.first_name"
                        :placeholder="$t('placeholder.first-name')"
                    />
                  </div>
                  <div class="col-span-12 intro-y sm:col-span-6">
                    <FormLabel htmlFor="user_last_input">
                      {{ $t('label.last-name') }}
                    </FormLabel>
                    <InputText
                        name="last_name"
                        id="user_last_input"
                        type="text"
                        :disabled="isRegisteredCustomer"
                        v-model="customer.last_name"
                        :placeholder="$t('placeholder.last-name')"
                    />
                  </div>
                </div>
              </template>
            </BaseCard>
            <!-- END: Customer Layout -->

            <!-- BEGIN: Product Layout -->
            <BaseCard
                class="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6"
                :title="$t('title.product')"
            >
              <template v-slot:body>

                <ParagraphShimmer :lines="10" :is-loading="isLoading"/>
                <div class="px-2 mt-2" v-if="!isLoading">
                  <div class="grid grid-cols-12 gap-4 mt-5 gap-y-5">
                    <div class="col-span-12 intro-y sm:col-span-6">
                      <FormLabel htmlFor="product_title">
                        {{ $t('label.title') }}
                      </FormLabel>
                      <InputText
                          name="title"
                          v-model="requestParams.order.product.title"
                          id="product_title"
                          type="text"
                          :placeholder="$t('placeholder.title')"
                      />
                    </div>
                    <div class="col-span-12 intro-y sm:col-span-6">
                      <FormLabel htmlFor="product_company">
                        {{ $t('label.company') }}
                      </FormLabel>
                      <InputText
                          name="company"
                          v-model="requestParams.order.product.company"
                          id="product_company"
                          type="text"
                          :placeholder="$t('placeholder.company')"
                      />
                    </div>
                    <div class="col-span-12 intro-y sm:col-span-6">
                      <FormLabel htmlFor="product_quantity">
                        {{ $t('label.quantity') }}
                      </FormLabel>
                      <InputText
                          name="quantity"
                          v-model="requestParams.order.product.quantity"
                          id="product_quantity"
                          type="text"
                          :placeholder="$t('placeholder.quantity')"
                      />
                    </div>
                    <div class="col-span-12 intro-y sm:col-span-6">
                      <FormLabel htmlFor="product_quantity_unit">
                        {{ $t('label.quantity-unit') }}
                      </FormLabel>
                      <InputText
                          name="quantity_unit"
                          v-model="requestParams.order.product.quantity_unit"
                          id="product_quantity_unit"
                          type="text"
                          :placeholder="$t('placeholder.quantity-unit')"
                      />
                    </div>
                    <div class="col-span-12 intro-y sm:col-span-12">
                      <FormLabel htmlFor="product_description">
                        {{ $t('label.description') }}
                      </FormLabel>
                      <FormTextarea
                          id="validation-form-6"
                          v-model="requestParams.order.product.description"
                          rows="5"
                          name="description"
                          :placeholder="$t('placeholder.description')"
                      ></FormTextarea>
                    </div>
                  </div>
                </div>
              </template>
            </BaseCard>
            <!-- END: Product Layout -->

            <!-- BEGIN: Delivery Layout -->
            <BaseCard
                class="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6"
                :title="$t('title.delivery')"
            >
              <template v-slot:body>
                <ParagraphShimmer :lines="10" :is-loading="isLoading"/>
                <div class="px-2 mt-2" v-if="!isLoading">
                  <div class="grid grid-cols-12 gap-4 mt-5 gap-y-5">
                    <div class="col-span-12 intro-y sm:col-span-6">
                      <FormLabel htmlFor="delivery_country">
                        {{ $t('label.country') }}
                      </FormLabel>
                      <InputText
                          name="country"
                          v-model="requestParams.order.delivery.country"
                          id="delivery_country"
                          type="text"
                          :placeholder="$t('placeholder.country')"
                      />
                    </div>
                    <div class="col-span-12 intro-y sm:col-span-6">
                      <FormLabel htmlFor="delivery_state">
                        {{ $t('label.state') }}
                      </FormLabel>
                      <InputText
                          name="state"
                          v-model="requestParams.order.delivery.state"
                          id="delivery_state"
                          type="text"
                          :placeholder="$t('placeholder.state')"
                      />
                    </div>
                    <div class="col-span-12 intro-y sm:col-span-6">
                      <FormLabel htmlFor="delivery_city">
                        {{ $t('label.city') }}
                      </FormLabel>
                      <InputText
                          name="city"
                          v-model="requestParams.order.delivery.city"
                          id="delivery_city"
                          type="text"
                          :placeholder="$t('placeholder.city')"
                      />
                    </div>
                    <div class="col-span-12 intro-y sm:col-span-6">
                      <FormLabel htmlFor="delivery_zip">
                        {{ $t('label.zip-code') }}
                      </FormLabel>
                      <InputText
                          name="zip_code"
                          v-model="requestParams.order.delivery.zip_code"
                          id="delivery_zip"
                          type="text"
                          :placeholder="$t('placeholder.zip-code')"
                      />
                    </div>
                    <div class="col-span-12 intro-y sm:col-span-12">
                      <FormLabel htmlFor="product_description">
                        {{ $t('label.address') }}
                      </FormLabel>
                      <FormTextarea
                          id="validation-form-6"
                          v-model="requestParams.order.delivery.address"
                          rows="5"
                          name="address"
                          :placeholder="$t('placeholder.address')"
                      ></FormTextarea>
                    </div>
                  </div>
                </div>
              </template>
            </BaseCard>
            <!-- END: Delivery Layout -->

            <!-- BEGIN: Dropzone Layout -->
            <BaseCard
                class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12"
                :title="$t('title.file-upload')"
            >
              <template v-slot:body>
                <div
                    class="px-2 mt-2"
                >
                  <FreeStyleShimmer height="180px" width="100%" :is-loading="isLoading"/>
                  <div class="grid grid-cols-12 gap-4 mt-5 gap-y-5" v-if="!isLoading">
                    <div class="col-span-12 intro-y sm:col-span-12">
                      <Dropzone
                          refKey="dropzoneMultipleRef"
                          :options="{
                    method: 'post',
                    url: base_url + uri.admin.media.private.add,
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
                           requestParams.order.attachments.push(response.data)
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
                </div>
              </template>
            </BaseCard>
            <!-- END: Dropzone Layout -->
          </div>
        </Form>
      </div>

      <template v-slot:footer>
        <div class="flex col-md-12 items-end justify-end gap-2">
          <Button variant="outline-secondary" @click="close" size="sm" class=" shadow-md justify-end items-end">
            {{ $t('button.cancel') }}
          </Button>
          <Button variant="primary" size="sm" form="myForm" class=" shadow-md justify-end items-end">
            {{ $t('button.add-request') }}
          </Button>
        </div>
      </template>

    </BaseDialog>
  </section>
</template>

<style scoped>

</style>