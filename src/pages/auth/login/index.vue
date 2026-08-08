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
import { ApiError } from "@/core/api/apiError";

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
  onSuccess: async (data) => {
    if (data?.data) {
      userStore.setUser(data.data);

      try {
        await authRepo.verify();
      } catch (err) {
        userStore.setLogout();
        if (err instanceof ApiError && err.code === 401) {
          errorMessage.value = $t('title.auth.verifyInvalid');
          return;
        }
        errorMessage.value = $t('title.auth.verifyFailed');
        return;
      }

      userStore.setShowLoginHistoryModal(true);
      const redirectPath = (typeof route.query.redirect === 'string' ? route.query.redirect : Array.isArray(route.query.redirect) ? route.query.redirect[0] : null) || '/';
      router.push(redirectPath);
    } else if (data?.result === false && data?.error?.message) {
      errorMessage.value = data.error.message;
    }
  },
  onError: (err) => {
    errorMessage.value = err.message || $t('title.auth.loginError');
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

const featureItems = [
  { icon: 'ShieldCheck', label: 'title.auth.feature-risk' },
  { icon: 'Leaf', label: 'title.auth.feature-sustainability' },
  { icon: 'Activity', label: 'title.auth.feature-resilience' },
];
</script>

<template>
  <div
      class="login-page-bg min-h-screen flex items-center justify-center -mx-3 sm:-mx-8 p-3 sm:px-8 relative overflow-hidden"
  >
    <!-- Decorative blurred color orbs behind the glass -->
    <div class="login-orb login-orb--one" aria-hidden="true"></div>
    <div class="login-orb login-orb--two" aria-hidden="true"></div>
    <div class="login-orb login-orb--three" aria-hidden="true"></div>

    <div class="w-full max-w-6xl flex flex-col lg:flex-row lg:items-center lg:gap-12 relative z-10">
      <!-- Left: Branding panel (lg and up) -->
      <div class="hidden lg:flex lg:flex-1 flex-col justify-center items-start gap-7">
        <div class="login-logo-badge flex items-center justify-center rounded-3xl p-6">
          <img
              :alt="$t('title.logo-alt')"
              class="w-32 h-32 object-contain drop-shadow-lg"
              :src="logoUrl"
          />
        </div>
        <div>
          <h1 class="text-xl font-extrabold text-primary dark:text-white leading-snug">
            {{ $t('title.panel-title') }}
          </h1>
        </div>
        <ul class="space-y-3">
          <li
              v-for="item in featureItems"
              :key="item.label"
              class="flex items-center gap-3"
          >
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">
              <Lucide :icon="item.icon" class="h-4.5 w-4.5" />
            </span>
            <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ $t(item.label) }}</span>
          </li>
        </ul>
      </div>

      <!-- Right: Login form card -->
      <div class="flex-1 flex items-center justify-center">
        <div class="w-full max-w-md">
          <!-- Compact branding below lg -->
          <div class="lg:hidden flex flex-col items-center gap-4 mb-8 text-center">
            <div class="login-logo-badge flex items-center justify-center rounded-2xl p-4">
              <img :alt="$t('title.logo-alt')" class="w-20 h-20 object-contain drop-shadow-lg" :src="logoUrl" />
            </div>
            <div>
              <h1 class="text-lg font-extrabold text-primary dark:text-white leading-snug">
                {{ $t('title.panel-title') }}
              </h1>
            </div>
          </div>

          <div class="login-card rounded-xl border border-slate-200/80 bg-white p-8 shadow-sm dark:border-slate-700/60 dark:bg-darkmode-800">
            <h2 class="text-xl font-extrabold text-slate-900 dark:text-white">
              {{ $t('title.auth.loginTitle') }}
            </h2>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ $t('title.auth.loginDescription') }}
            </p>

            <div
                v-if="errorMessage"
                class="mt-4 p-4 rounded-xl bg-danger/15 border border-danger/30 text-danger text-sm backdrop-blur-sm"
                role="alert"
            >
              {{ errorMessage }}
            </div>

            <Form
                :validation-schema="validationSchema"
                @submit="login"
                v-slot="{ isSubmitting }"
                class="mt-6 space-y-5"
            >
              <Field name="identity" v-slot="{ field, errors }">
                <label class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-200" dir="rtl">
                  <span class="text-danger">*</span> {{ $t('input.username') }}
                </label>
                <FormInput
                    v-bind="field"
                    type="text"
                    class="login-input block w-full px-4 rounded-lg border-slate-300 dark:border-slate-600"
                    dir="ltr"
                    :class="{ 'border-danger focus:border-danger': errors.length > 0 }"
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
                    class="login-input block w-full px-4 rounded-lg border-slate-300 dark:border-slate-600"
                    dir="ltr"
                    :class="{ 'border-danger focus:border-danger': errors.length > 0 }"
                    :placeholder="$t('input.password')"
                />
                <FormErrorMessage name="credential" />
              </Field>

              <div class="pt-1">
                <Button
                    v-if="!loginMutation.isLoading.value && !isSubmitting"
                    variant="primary"
                    class="w-full !h-12 rounded-lg font-semibold"
                    type="submit"
                >
                  {{ $t('button.login') }}
                  <Lucide icon="ArrowLeft" class="inline-block ms-2 h-4 w-4" />
                </Button>
                <free-style-shimmer v-else width="100%" height="48px" class="rounded-lg" />
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
  background: linear-gradient(135deg, #f0fdfa 0%, #f8fafc 45%, #ecfeff 100%);
}
.dark .login-page-bg {
  background: linear-gradient(135deg, #0b1220 0%, #0f172a 45%, #134e4a 100%);
}

/* Card — matches dashboard cards (bg-surface, slate border, shadow-sm) */
.login-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.1);
}
.dark .login-card {
  background: rgba(27, 37, 59, 0.9);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Logo badge — primary-muted tint (dashboard header style) */
.login-logo-badge {
  background: rgba(204, 251, 241, 0.6);
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  border: 1px solid rgba(153, 246, 228, 0.8);
  box-shadow: 0 8px 32px rgba(15, 118, 110, 0.12);
}
.dark .login-logo-badge {
  background: rgba(45, 212, 191, 0.1);
  border: 1px solid rgba(45, 212, 191, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Inputs — solid surface with teal focus ring (FormInput base) */
.login-input {
  height: 3rem !important;
  background: #fff;
}
.dark .login-input {
  background: #0f172a;
}

/* Decorative blurred orbs — brand palette (teal / cyan) */
.login-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(80px);
  opacity: 0.5;
  pointer-events: none;
}
.login-orb--one {
  width: 26rem;
  height: 26rem;
  top: -6rem;
  inset-inline-start: -6rem;
  background: #0f766e;
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
  background: #2dd4bf;
  opacity: 0.3;
}
</style>
