<script setup lang="js">
import logoUrl from "@/assets/demo/logo.png";
import { FormInput } from "@/base-components/Form";
import Button from "@/base-components/Button";
import { ref } from "vue";
import { Form, Field } from 'vee-validate';
import FormErrorMessage from '@/base-components/Form/FormErrorMessage.vue';
import { useUserStore } from "@/stores/user.js";
import { useRoute, useRouter } from "vue-router";
import Lucide from "@/base-components/Lucide/index.ts";
import { useI18n } from "vue-i18n";
import { useValidationCache } from "@/composables/useValidationCache.js";
import { useMutation } from "@/core/composables/useMutation";
import { authRepo } from "@/core/repositories/authRepo";

const { t: $t } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const errorMessage = ref('');

const validationSchema = useValidationCache(['identity', 'credential']);

const loginMutation = useMutation({
  mutationFn: async (vals) => {
    return authRepo.login({
      identity: vals.identity,
      credential: vals.credential,
    });
  },
  onSuccess: (data) => {
    if (data?.data) {
      userStore.setUser(data.data);
      const redirectPath = (typeof route.query.redirect === 'string' ? route.query.redirect : Array.isArray(route.query.redirect) ? route.query.redirect[0] : null) || '/';
      router.push(redirectPath);
    } else if (data?.result === false && data?.error?.message) {
      errorMessage.value = data.error.message;
    }
  },
  onError: (err) => {
    errorMessage.value = err.message || 'An error occurred while logging in.';
  },
});

const login = async (values) => {
  errorMessage.value = '';
  try {
    const data = await loginMutation.mutate(values);
    if (data?.result === false && data?.error?.message) {
      errorMessage.value = data.error.message;
    }
  } catch {
    //
  }
};
</script>

<template>
  <div
    class="login-page-bg min-h-screen flex items-center justify-center -m-3 sm:-mx-8 p-3 sm:px-8"
  >
    <div class="w-full max-w-6xl flex flex-col xl:flex-row xl:items-center xl:gap-12">
      <!-- Left: Branding (Diamond-style) -->
      <div class="hidden xl:flex xl:flex-1 flex-col justify-center">
        <img
          :alt="$t('title.logo-alt')"
          class="w-72"
          :src="logoUrl"
        />
        <div class="mt-8 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {{ $t('title.panel-title') }}
        </div>
        <p class="mt-2 text-slate-600 dark:text-slate-400">
          سامانه رعایت قوانین و مقررات و ریسک تطبیق
        </p>
      </div>

      <!-- Right: Login form (Diamond-style card) -->
      <div class="flex-1 flex items-center justify-center">
        <div class="w-full max-w-md">
          <div class="xl:hidden flex justify-center mb-8">
            <img :alt="$t('title.logo-alt')" class="w-44" :src="logoUrl" />
          </div>

          <div
            class="bg-white dark:bg-darkmode-800 rounded-xl shadow-sm border border-slate-200/70 dark:border-darkmode-700/80 p-8"
          >
            <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              ورود به پنل
            </h2>

            <div v-if="errorMessage" class="mb-4 p-4 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              {{ errorMessage }}
            </div>

            <Form
              :validation-schema="validationSchema"
              @submit="login"
              v-slot="{ isSubmitting }"
              class="space-y-4"
            >
              <Field name="identity" v-slot="{ field, errors }">
                <label class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300" dir="rtl">
                  <span class="text-danger">*</span> {{ $t('input.username') }}
                </label>
                <FormInput
                  v-bind="field"
                  type="text"
                  class="block w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-darkmode-600 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition-colors"
                  dir="ltr"
                  :class="{ 'border-danger': errors.length > 0 }"
                  :placeholder="$t('input.username')"
                />
                <FormErrorMessage name="identity" />
              </Field>

              <Field name="credential" v-slot="{ field, errors }">
                <label class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300" dir="rtl">
                  <span class="text-danger">*</span> {{ $t('input.password') }}
                </label>
                <FormInput
                  v-bind="field"
                  type="password"
                  class="block w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-darkmode-600 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition-colors"
                  dir="ltr"
                  :class="{ 'border-danger': errors.length > 0 }"
                  :placeholder="$t('input.password')"
                />
                <FormErrorMessage name="credential" />
              </Field>

              <div class="pt-2">
                <Button
                  v-if="!loginMutation.isLoading.value && !isSubmitting"
                  variant="primary"
                  class="w-full py-3 rounded-lg font-medium bg-slate-900 hover:bg-slate-800 border-slate-900"
                  type="submit"
                >
                  {{ $t('button.login') }}
                  <Lucide icon="ArrowLeft" class="inline-block ms-2 h-4 w-4" />
                </Button>
                <free-style-shimmer v-else width="100%" height="44px" class="rounded-lg" />
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page-bg {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 45%, #e2e8f0 100%);
}
.dark .login-page-bg {
  background: linear-gradient(135deg, #0f172a 0%, #111827 45%, #0b1220 100%);
}
</style>
