<script setup lang="js">
import logoUrl from "@/assets/grc-logo.png";
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
      class="login-page-bg min-h-screen flex items-center justify-center -m-3 sm:-mx-8 p-3 sm:px-8 relative overflow-hidden"
  >
    <!-- Decorative blurred color orbs behind the glass -->
    <div class="login-orb login-orb--one" aria-hidden="true"></div>
    <div class="login-orb login-orb--two" aria-hidden="true"></div>
    <div class="login-orb login-orb--three" aria-hidden="true"></div>

    <div class="w-full max-w-6xl flex flex-col xl:flex-row xl:items-center xl:gap-12 relative z-10">
      <!-- Left: Branding -->
      <div class="hidden xl:flex xl:flex-1 flex-col justify-center items-start gap-6">
        <div class="login-logo-badge flex items-center justify-center rounded-3xl p-6">
          <img
              :alt="$t('title.logo-alt')"
              class="w-40 h-40 object-contain drop-shadow-lg"
              :src="logoUrl"
          />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
            سامانه حاکمیت، ریسک و انطباق
          </h1>
          <p class="mt-3 max-w-md text-slate-600 dark:text-slate-300 leading-relaxed">
            مدیریت یکپارچه‌ی حاکمیت سازمانی، پایش ریسک و انطباق با چارچوب‌های نظارتی در یک پلتفرم امن.
          </p>
        </div>
      </div>

      <!-- Right: Login form (glassmorphism card) -->
      <div class="flex-1 flex items-center justify-center">
        <div class="w-full max-w-md">
          <div class="xl:hidden flex flex-col items-center gap-3 mb-6">
            <div class="login-logo-badge flex items-center justify-center rounded-2xl p-4">
              <img :alt="$t('title.logo-alt')" class="w-24 h-24 object-contain drop-shadow-lg" :src="logoUrl" />
            </div>
            <h1 class="text-lg font-bold text-slate-900 dark:text-white text-center">
              سامانه حاکمیت، ریسک و انطباق
            </h1>
          </div>

          <div class="login-glass-card rounded-2xl p-8">
            <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-6">
              ورود به پنل
            </h2>

            <div
                v-if="errorMessage"
                class="mb-4 p-4 rounded-lg bg-danger/15 border border-danger/30 text-danger text-sm backdrop-blur-sm"
            >
              {{ errorMessage }}
            </div>

            <Form
                :validation-schema="validationSchema"
                @submit="login"
                v-slot="{ isSubmitting }"
                class="space-y-4"
            >
              <Field name="identity" v-slot="{ field, errors }">
                <label class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-200" dir="rtl">
                  <span class="text-danger">*</span> {{ $t('input.username') }}
                </label>
                <FormInput
                    v-bind="field"
                    type="text"
                    class="login-glass-input block w-full px-4 py-3 rounded-lg transition-colors"
                    dir="ltr"
                    :class="{ 'border-danger': errors.length > 0 }"
                    :placeholder="$t('input.username')"
                />
                <FormErrorMessage name="identity" />
              </Field>

              <Field name="credential" v-slot="{ field, errors }">
                <label class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-200" dir="rtl">
                  <span class="text-danger">*</span> {{ $t('input.password') }}
                </label>
                <FormInput
                    v-bind="field"
                    type="password"
                    class="login-glass-input block w-full px-4 py-3 rounded-lg transition-colors"
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
                    class="w-full py-3 rounded-lg font-medium login-glass-btn"
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
  background: linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 45%, #cffafe 100%);
}
.dark .login-page-bg {
  background: linear-gradient(135deg, #0b1220 0%, #111827 45%, #0f172a 100%);
}

/* Glass card */
.login-glass-card {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.18);
}
.dark .login-glass-card {
  background: rgba(30, 41, 59, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
}

/* Glass logo badge */
.login-logo-badge {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.15);
}
.dark .login-logo-badge {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Glass inputs */
.login-glass-input {
  background: rgba(255, 255, 255, 0.55) !important;
  border: 1px solid rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.login-glass-input:focus {
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.18);
  border-color: rgba(148, 163, 184, 0.9) !important;
}
.dark .login-glass-input {
  background: rgba(15, 23, 42, 0.45) !important;
  border: 1px solid rgba(148, 163, 184, 0.25) !important;
  color: #e2e8f0;
}

/* Glass button */
.login-glass-btn {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: #fff;
}
.login-glass-btn:hover {
  background: rgba(15, 23, 42, 0.95);
}

/* Decorative blurred orbs */
.login-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(80px);
  opacity: 0.55;
  pointer-events: none;
}
.login-orb--one {
  width: 26rem;
  height: 26rem;
  top: -6rem;
  inset-inline-start: -6rem;
  background: #6366f1;
}
.login-orb--two {
  width: 22rem;
  height: 22rem;
  bottom: -5rem;
  inset-inline-end: -4rem;
  background: #06b6d4;
}
.login-orb--three {
  width: 18rem;
  height: 18rem;
  top: 40%;
  inset-inline-end: 30%;
  background: #38bdf8;
  opacity: 0.35;
}
</style>
