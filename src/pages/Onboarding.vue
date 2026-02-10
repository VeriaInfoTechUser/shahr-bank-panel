<script setup lang="js">
import logoUrl from "@/assets/shahr/logo.png";
import illustrationUrl from "@/assets/images/illustrations/onboarding/2fa-web.svg";
import {FormInput, FormLabel, FormSwitch, FormTextarea} from "../base-components/Form";
import Button from "../base-components/Button";
import {useFetch} from '../composables/useFetch';
import {onMounted, ref} from "vue";
import {Form} from 'vee-validate';
import {useUserStore} from "../stores/user.js";
import {useRoute, useRouter} from "vue-router";
import {uri} from "@/constants/config.js";
import Lucide from "@/base-components/Lucide/index.ts";
import {useI18n} from "vue-i18n";
import {useLogout} from "@/composables/useLogout.js";
import InputText from "@/base-components/Form/InputText.vue";
import {object} from "yup";
import useValidate from "@/composables/useValidate.js";

const {t: $t} = useI18n()
const route = useRoute()
const router = useRouter()
const user = useUserStore()

const fetchResponse = ref({
  firstName: null,
  lastName: null,
  nationalCode: null,
  address: null,
  isNationalCodeValidated: null,
  mobile: null,
  email: null,
  isMobileValidated: null,
  isEmailValidated: null,
})
const formStep1 = ref({
      firstName: null,
      lastName: null,
      nationalCode: null,
      address: null,
    })
;
const loadingFlag = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const informationStep1Flag = ref(true)
const emailOtpSendingStatus = ref(false)
const emailOtpLoadingStatus = ref(false)
const emailOtpCode = ref('')
const mobileOtpSendingStatus = ref(false)
const mobileOtpLoadingStatus = ref(false)
const mobileOtpCode = ref('')
const validationSchema = object(useValidate(['first_name', 'last_name', 'national_id']));
const isLoading = ref(false)


const setProfileReal = async () => {
  loadingFlag.value = true;
  successMessage.value = '';
  errorMessage.value = '';
  try {
    // Await the result of useFetch
    const {data, error} = await useFetch(uri.api.user.profile.real, {body: formStep1.value});
    if (error) {
      errorMessage.value = error.message || 'An error occurred while logging in.';
    } else {
      informationStep1Flag.value = false
    }
  } catch (err) {
    errorMessage.value = err.message || 'An unexpected error occurred.';
  } finally {
    loadingFlag.value = false;
  }
};
const profileValidate = async () => {
}
async function getOnboardingData() {
  try {
    // Await the result of useFetch
    const {data, error, response, statusCode} = await useFetch(uri.api.user.profile.onboarding, {method: "GET"});
    if (error) {
      errorMessage.value = error.message || 'An error occurred while logging in.';
    } else {
      fetchResponse.value = data
      formStep1.value.firstName = data.firstName ?? ""
      formStep1.value.lastName = data.lastName ?? ""
      formStep1.value.nationalCode = data.nationalCode ?? ""
      formStep1.value.address = data.address ?? ""
    }
  } catch (err) {
    errorMessage.value = err.message || 'An unexpected error occurred.';
  } finally {
    loadingFlag.value = false;
  }

}
async function requestVerifyEmail() {
  try {
    emailOtpCode.value = ''
    emailOtpLoadingStatus.value = true
    const {
      data,
      error,
      response,
      statusCode
    } = await useFetch(uri.api.user.profile.validate.email, {body: {email: fetchResponse.value.email}});
    if (error) {
      emailOtpSendingStatus.value = false
      errorMessage.value = error.message || 'An error occurred while logging in.';
    } else {
      emailOtpSendingStatus.value = true
    }
    emailOtpLoadingStatus.value = false
  } catch (err) {
    errorMessage.value = err.message || 'An unexpected error occurred.';
  } finally {
    loadingFlag.value = false;
  }
}
async function verifyEmail() {
  try {
    // Await the result of useFetch
    const {
      data,
      error,
      response,
      statusCode
    } = await useFetch(uri.api.user.profile.validate.email, {body: {email: fetchResponse.value.email,code:emailOtpCode.value}});
    if (error) {
      emailOtpSendingStatus.value = false
      errorMessage.value = error.message || 'An error occurred while logging in.';
    } else {
      emailOtpSendingStatus.value = true
      fetchResponse.value.isEmailValidated = true
    }
    await getOnboardingData()
    emailOtpLoadingStatus.value = false
  } catch (err) {
    errorMessage.value = err.message || 'An unexpected error occurred.';
  } finally {
    loadingFlag.value = false;
  }
}

async function requestVerifyMobile() {
  try {
    mobileOtpCode.value = ''
    mobileOtpLoadingStatus.value = true
    const {
      data,
      error,
      response,
      statusCode
    } = await useFetch(uri.api.user.profile.validate.mobile, {body: {mobile: fetchResponse.value.mobile}});
    if (error) {
      mobileOtpSendingStatus.value = false
      errorMessage.value = error.message || 'An error occurred while logging in.';
    } else {
      mobileOtpSendingStatus.value = true
    }
    mobileOtpLoadingStatus.value = false
  } catch (err) {
    errorMessage.value = err.message || 'An unexpected error occurred.';
  } finally {
    loadingFlag.value = false;
  }
}
async function verifyMobile() {
  try {
    // Await the result of useFetch
    const {
      data,
      error,
      response,
      statusCode
    } = await useFetch(uri.api.user.profile.validate.mobile, {body: {mobile: fetchResponse.value.mobile,code:mobileOtpCode.value}});
    if (error) {
      mobileOtpSendingStatus.value = false
      errorMessage.value = error.message || 'An error occurred while logging in.';
    } else {
      mobileOtpSendingStatus.value = true
      fetchResponse.value.isEmailValidated = true
    }
    await getOnboardingData()
    mobileOtpLoadingStatus.value = false
  } catch (err) {
    errorMessage.value = err.message || 'An unexpected error occurred.';
  } finally {
    loadingFlag.value = false;
  }
}

onMounted(() => {
  if (!user.currentJwtBody) {
    router.push("/login")
  } else {
    getOnboardingData()
  }
})

async function verifyProfile() {
  loadingFlag.value = true
  try {
    // Await the result of useFetch
    const {
      data,
      error,
      response,
      statusCode
    } = await useFetch(uri.api.user.profile.validate.profile, {
      body: { },
      method:"POST"
    });
    if (error) {
      errorMessage.value = error.message || 'An error occurred while logging in.';
    } else {
      successMessage.value = 'Login successful!';
      await refreshToken();
    }
  } catch (err) {
    errorMessage.value = err.message || 'An unexpected error occurred.';
  } finally {
    loadingFlag.value = false;
  }

}
async function refreshToken() {
  try {
    // Await the result of useFetch
    const {data, error} = await useFetch(uri.api.auth.refresh, {method:"GET"});
    if (error) {
      errorMessage.value = error.message || 'An error occurred while logging in.';
    } else {
      user.setUser(data)
      const redirectPath = router.currentRoute.value.query.redirect || '/';
      await router.push(redirectPath);
    }
  } catch (err) {
    errorMessage.value = err.message || 'An unexpected error occurred.';
  } finally {
    loadingFlag.value = false;
  }
}
</script>

<template>
  <div
      :class="[
      '-m-3 sm:-mx-8 p-3 sm:px-8 relative h-screen lg:overflow-hidden bg-primary xl:bg-white dark:bg-darkmode-800 xl:dark:bg-darkmode-600',
      'before:hidden before:xl:block before:content-[\'\'] before:w-[57%] before:-mt-[28%] before:-mb-[16%] before:-mr-[13%] before:absolute before:inset-y-0 before:right-0 before:transform before:rotate-[-4.5deg] before:bg-primary/20 before:rounded-[100%] before:dark:bg-darkmode-400',
      'after:hidden after:xl:block after:content-[\'\'] after:w-[57%] after:-mt-[20%] after:-mb-[13%] after:-mr-[13%] after:absolute after:inset-y-0 after:right-0 after:transform after:rotate-[-4.5deg] after:bg-primary after:rounded-[100%] after:dark:bg-darkmode-700',
    ]"
  >
    <!--    <DarkModeSwitcher/>-->
    <!--    <MainColorSwitcher />-->
    <div class="container relative z-10 sm:px-10">
      <div class="block grid-cols-2 gap-4 xl:grid">
        <!-- BEGIN: Login Info -->
        <div class="flex-col hidden min-h-screen xl:flex">
          <a href="" class="flex items-center pt-5 -intro-x">
            <img
                :alt="$t('title.logo-alt')"
                class="w-14"
                :src="logoUrl"
            />
            <span class="ml-3 text-lg text-white"> {{ $t('title.web-title') }} </span>
          </a>
          <div class="my-auto">
            <img
                alt="Midone Tailwind HTML Admin Template"
                class="w-3/5 -mt-16 -intro-x"
                :src="illustrationUrl"
            />
            <div
                class="mt-10 text-4xl font-medium leading-tight text-white -intro-x"
            >
              {{ $t('title.web-title') }}
            </div>
            <div
                class="mt-5 text-lg text-white -intro-x text-opacity-70 dark:text-slate-400"
                v-html=" $t('text.web-bio').replace(/\n/g, '<br>')"
            />
          </div>
        </div>
        <!-- END: Login Info -->
        <!-- BEGIN: Login Form -->
        <div class="flex h-screen py-5 my-10 xl:h-auto xl:py-0 xl:my-0 w-full">
          <div
              class="w-full px-5 pb-8 mx-auto my-auto bg-white rounded-md shadow-md xl:ml-20 dark:bg-darkmode-600 xl:bg-transparent sm:px-8 xl:p-0 xl:shadow-none sm:w-3/4 lg:w-2/4 xl:w-full"
          >

            <div class="w-full my-4 border-b border-gray-200 grid grid-cols-3 gap-4 py-2">
              <Button
                  variant="primary"
                  class="w-full text-xs align-top gap-2"
                  type="submit"
                  size="sm"
                  @click="useLogout"
              >
                <Lucide icon="LogOut" class="block  "/>
                {{ $t('button.logout') }}
              </Button>
            </div>

            <div class="mt-2 text-center intro-x text-slate-400 xl:hidden">
              {{ $t("text.web-bio") }}
            </div>

            <Form class="w-full" :validation-schema="validationSchema" @submit="setProfileReal"
                  v-if="informationStep1Flag">
              <input type="password" class="hidden"/>
              <input type="text" name="username" class="hidden"/>
              <input type="text" name="mobile" class="hidden"/>
              <input type="text" name="email" class="hidden"/>
              <div class="px-2 min-h-72">
                <ParagraphShimmer :lines="5" :is-loading="isLoading"/>
                <div class="grid grid-cols-12 gap-4 mt-5 gap-y-5" v-if="!isLoading">

                  <div class="col-span-12 intro-y sm:col-span-6">
                    <FormLabel htmlFor="input-wizard-3">
                      {{ $t('label.first-name') }}
                    </FormLabel>
                    <InputText
                        name="first_name"
                        v-model="formStep1.firstName"
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
                        v-model="formStep1.lastName"
                        id="input-wizard-3"
                        type="text"
                    />
                  </div>

                  <div class="col-span-12 intro-y ">
                    <FormLabel htmlFor="input-wizard-3">
                      {{ $t('label.national-id') }}
                    </FormLabel>
                    <InputText
                        dir="ltr"
                        name="national_id"
                        v-model="formStep1.nationalCode"
                        id="input-wizard-3"
                        type="text"
                    />
                  </div>

                  <div class="col-span-12 intro-y sm:col-span-12">
                    <FormLabel htmlFor="product_description">
                      {{ $t('label.address') }}
                    </FormLabel>
                    <FormTextarea
                        id="validation-form-6"
                        v-model="formStep1.address"
                        rows="5"
                        name="address"
                    ></FormTextarea>
                  </div>

                </div>
              </div>

              <div class="mt-5 intro-x xl:mt-8 text-end">
                <Button
                    v-if="!loadingFlag"
                    variant="dark"
                    class="  px-2 py-1 align-top xl:w-32 xl:mr-3"
                    type="submit"
                    size="sm"
                >
                  {{ $t('button.next-step') }}
                  <Lucide icon="ArrowLeft" class="block me-0 float-left h-4"/>
                </Button>
                <free-style-shimmer v-else width="100%" height="25px" class="w-full"/>
              </div>
            </Form>

            <div class="w-full" v-else>
              <div class="px-2">
                <div class="grid grid-cols-12 gap-4 mt-5 gap-y-5" v-if="!isLoading">
                  <Form class="col-span-12 grid grid-cols-12 intro-y relative"
                        :validation-schema="object(useValidate(['mobile']))" @submit="requestVerifyMobile">
                    <div class="col-span-8 intro-y">
                      <InputText
                          :dir="'ltr'"
                          name="mobile"
                          :has-label="true"
                          :disabled="fetchResponse.isMobileValidated"
                          :label="$t('label.mobile')"
                          v-model="fetchResponse.mobile"
                          id="input-wizard-3"
                          type="text"
                      />
                    </div>
                    <div class="col-span-4 intro-y relative">
                      <div v-if="fetchResponse.isMobileValidated">
                        <Lucide icon="Verified" class="text-success absolute bottom-0 end-0 me-0 float-left h-10 w-10"/>
                      </div>
                      <div v-else-if="(mobileOtpSendingStatus&&!mobileOtpLoadingStatus)">
                        <div class="relative flex mx-auto ps-4">
                          <InputText
                              class="w-full pe-9"
                              :dir="'ltr'"
                              :has-label="true"
                              :label="$t('title.code')"
                              name="email_otp"
                              id="input-wizard-3"
                              v-model="mobileOtpCode"
                          />
                          <div
                              class="cursor-pointer flex absolute bottom-0 end-0 items-center h-[40px] justify-center w-10 border bg-slate-100 rounded-ltext-slate-500 dark:bg-darkmode-700 dark:border-darkmode-800 dark:text-slate-400"
                              @click="verifyMobile"
                          >
                            <Lucide icon="ArrowBigLeft" class="w-6 h-5 text-black"/>
                          </div>
                        </div>
                      </div>
                      <div class=" absolute bottom-0 w-full ps-4" v-else>
                        <Button
                            variant="outline-primary"
                            :disabled="mobileOtpLoadingStatus"
                            class=" px-2 py-1 align-top w-full"
                            type="submit"
                            size="lg"
                        >
                          {{ $t('button.send-code') }}
                          <Lucide icon="Smartphone" class="block me-0 float-left h-4"/>
                        </Button>
                      </div>
                    </div>
                  </Form>

                  <Form class="col-span-12 grid grid-cols-12 intro-y relative"
                        :validation-schema="object(useValidate(['email']))" @submit="requestVerifyEmail">
                    <div class="col-span-8 intro-y">
                      <InputText
                          :dir="'ltr'"
                          :label="$t('label.email')"
                          :has-label="true"
                          :disabled="fetchResponse.isEmailValidated||emailOtpLoadingStatus||emailOtpSendingStatus"
                          name="email"
                          v-model="fetchResponse.email"
                          id="input-wizard-3"
                          type="text"
                      />
                    </div>
                    <div class="col-span-4 intro-y relative">
                      <div v-if="fetchResponse.isEmailValidated" class="w-full">
                        <Lucide icon="Verified" class="absolute bottom-0 end-0 text-success me-0 float-left h-10 w-10"/>
                      </div>
                      <div v-else-if="(emailOtpSendingStatus&&!emailOtpLoadingStatus)">
                        <div class="relative flex mx-auto ps-4">
                          <InputText
                              class="w-full pe-9"
                              :dir="'ltr'"
                              :has-label="true"
                              :label="$t('title.code')"
                              name="email_otp"
                              id="input-wizard-3"
                              v-model="emailOtpCode"
                          />
                          <div
                              class="cursor-pointer flex absolute bottom-0 end-0 items-center h-[40px] justify-center w-10 border bg-slate-100 rounded-ltext-slate-500 dark:bg-darkmode-700 dark:border-darkmode-800 dark:text-slate-400"
                              @click="verifyEmail"
                          >
                            <Lucide icon="ArrowBigLeft" class="w-6 h-5 text-black"/>
                          </div>
                        </div>

                      </div>
                      <div class="absolute bottom-0 w-full ps-4" v-else>
                        <Button
                            variant="outline-primary"
                            :disabled="emailOtpLoadingStatus"
                            class=" px-2 py-1 align-top w-full"
                            type="submit"
                            size="lg"
                        >
                          {{ $t('button.send-code') }}
                          <Lucide icon="MailCheck" class="block me-0 float-left h-4"/>
                        </Button>
                      </div>
                    </div>
                  </Form>


                </div>
              </div>

              <div class="flex mt-5 xl:mt-8 w-full">
                <div class="text-center intro-x xl:text-start">
                  <Button
                      v-if="!loadingFlag"
                      variant="dark"
                      class="w-full px-2 py-1 align-top xl:w-32 xl:mr-3"
                      type="submit"
                      size="sm"
                      @click="informationStep1Flag=true"
                  >
                    {{ $t('button.back') }}
                  </Button>
                  <free-style-shimmer v-else width="100%" height="25px" class="w-full"/>
                </div>
                <div class="intro-x text-end w-full">
                  <Button
                      v-if="!loadingFlag"
                      variant="dark"
                      class="  px-2 py-1 align-top xl:w-32 xl:mr-3"
                      type="submit"
                      size="sm"
                      @click="verifyProfile"
                  >
                    {{ $t('button.continue') }}
                    <Lucide icon="Verified" class="block me-0 float-left h-4"/>
                  </Button>
                  <free-style-shimmer v-else width="100%" height="25px" class="w-full"/>
                </div>
              </div>
            </div>

          </div>
        </div>
        <!-- END: Login Form -->
      </div>
    </div>
  </div>
</template>
