<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { ermRepo } from '@/core/repositories/ermRepo';

const props = defineProps<{
  show: boolean;
  userId: number;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
}>();

const { t, locale } = useI18n();

const hidePassword = ref(true);
const pending = ref(false);

function analyzePassword(p: string) {
  return {
    len12: p.length >= 12,
    lower: /[a-z]/.test(p),
    upper: /[A-Z]/.test(p),
    digit: /[0-9]/.test(p),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p),
  };
}

function isPasswordValid(p: string): boolean {
  const c = analyzePassword(p);
  return c.len12 && c.lower && c.upper && c.digit && c.special;
}

const validationSchema = computed(() =>
  yup.object({
    credential: yup
      .string()
      .required(t('settings-page.liaisons-password-required'))
      .test(
        'policy',
        t('settings-page.liaisons-password-invalid'),
        (val) => isPasswordValid(val ?? '')
      ),
  })
);

const { handleSubmit, resetForm, validate } = useForm({
  validationSchema,
  initialValues: {
    credential: '',
  },
  validateOnMount: false,
});

const { value: password, errorMessage } = useField<string>('credential');

const checks = computed(() => analyzePassword(password.value ?? ''));

watch(locale, async () => {
  await nextTick();
  await validate();
});

watch(
  () => props.show,
  (v) => {
    if (v) {
      resetForm({ values: { credential: '' } });
      hidePassword.value = true;
    }
  }
);

function onVisible(v: boolean) {
  emit('update:show', v);
}

const onValidSubmit = handleSubmit(async (formValues) => {
  if (!Number.isFinite(props.userId) || props.userId <= 0) {
    toast(t('settings-page.liaisons-password-error'), { type: 'error' });
    return;
  }
  pending.value = true;
  try {
    const res = await ermRepo.memberPassword({
      user_id: props.userId,
      credential: formValues.credential,
    });
    if (!res?.result) {
      const msg = String(
        res?.error?.message ?? t('settings-page.liaisons-password-error')
      );
      toast(msg, { type: 'error' });
      return;
    }
    toast(t('settings-page.liaisons-password-success'), { type: 'success' });
    emit('update:show', false);
  } catch (e) {
    toast(
      (e as Error)?.message ?? t('settings-page.liaisons-password-error'),
      { type: 'error' }
    );
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <BaseModal
    :visible="show"
    size="sm"
    :title="t('settings-page.liaisons-password-modal-title')"
    content-class="p-4"
    @update:visible="onVisible"
  >
    <form
      id="liaison-member-password-form"
      class="flex flex-col gap-4"
      data-autofocus-modal
      novalidate
      @submit="onValidSubmit"
    >
      <div
        class="rounded-lg border border-slate-200/90 bg-slate-50/80 p-3 text-xs leading-relaxed dark:border-darkmode-600 dark:bg-darkmode-900/40"
        role="note"
      >
        <p
          class="m-0 mb-2 font-medium text-slate-700 dark:text-slate-200"
        >
          {{ t('settings-page.liaisons-password-hint-title') }}
        </p>
        <ul class="m-0 list-none space-y-2 ps-0">
          <li
            class="flex items-start gap-2"
            :class="
              checks.len12
                ? 'text-emerald-700 dark:text-emerald-400/95'
                : 'text-slate-600 dark:text-slate-300'
            "
          >
            <Lucide
              :icon="checks.len12 ? 'Check' : 'Circle'"
              class="mt-0.5 h-3.5 w-3.5 shrink-0"
              :class="checks.len12 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-500'"
              aria-hidden="true"
            />
            <span>{{ t('settings-page.liaisons-password-hint-1') }}</span>
          </li>
          <li
            class="flex items-start gap-2"
            :class="
              checks.lower && checks.upper
                ? 'text-emerald-700 dark:text-emerald-400/95'
                : 'text-slate-600 dark:text-slate-300'
            "
          >
            <Lucide
              :icon="checks.lower && checks.upper ? 'Check' : 'Circle'"
              class="mt-0.5 h-3.5 w-3.5 shrink-0"
              :class="
                checks.lower && checks.upper
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-300 dark:text-slate-500'
              "
              aria-hidden="true"
            />
            <span>{{ t('settings-page.liaisons-password-hint-2') }}</span>
          </li>
          <li
            class="flex items-start gap-2"
            :class="
              checks.digit
                ? 'text-emerald-700 dark:text-emerald-400/95'
                : 'text-slate-600 dark:text-slate-300'
            "
          >
            <Lucide
              :icon="checks.digit ? 'Check' : 'Circle'"
              class="mt-0.5 h-3.5 w-3.5 shrink-0"
              :class="checks.digit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-500'"
              aria-hidden="true"
            />
            <span>{{ t('settings-page.liaisons-password-hint-3') }}</span>
          </li>
          <li
            class="flex items-start gap-2"
            :class="
              checks.special
                ? 'text-emerald-700 dark:text-emerald-400/95'
                : 'text-slate-600 dark:text-slate-300'
            "
          >
            <Lucide
              :icon="checks.special ? 'Check' : 'Circle'"
              class="mt-0.5 h-3.5 w-3.5 shrink-0"
              :class="checks.special ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-500'"
              aria-hidden="true"
            />
            <span>{{ t('settings-page.liaisons-password-hint-4') }}</span>
          </li>
        </ul>
      </div>

      <div class="flex flex-col gap-1.5">
        <label
          class="text-sm font-medium text-slate-700 dark:text-slate-200"
          for="liaison-member-new-password"
        >
          {{ t('settings-page.liaisons-password-field-label') }}
        </label>
        <div class="relative flex w-full" dir="ltr">
          <button
            type="button"
            class="flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-l-md border px-3 transition-colors"
            :class="
              errorMessage
                ? 'border-error bg-error/10 text-error dark:border-error'
                : 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-darkmode-600 dark:bg-darkmode-700 dark:text-slate-300 dark:hover:bg-darkmode-600'
            "
            :aria-label="t('settings-page.liaisons-password-toggle-visibility')"
            :aria-pressed="!hidePassword"
            @click="hidePassword = !hidePassword"
          >
            <Lucide
              :icon="hidePassword ? 'Eye' : 'EyeOff'"
              class="h-4 w-4"
            />
          </button>
          <input
            id="liaison-member-new-password"
            v-model="password"
            class="form-control h-10 min-w-0 flex-1 rounded-none rounded-r-md border border-l-0 dark:border-darkmode-600"
            :class="
              errorMessage
                ? 'border-error focus:border-error focus:ring-error/30'
                : ''
            "
            :type="hidePassword ? 'password' : 'text'"
            name="credential"
            autocomplete="new-password"
            :placeholder="t('settings-page.liaisons-password-field-placeholder')"
          />
        </div>
        <p
          v-if="errorMessage"
          class="m-0 text-xs text-error"
          role="alert"
        >
          {{ errorMessage }}
        </p>
      </div>
    </form>

    <template #footer>
      <Button
        type="button"
        variant="outline-secondary"
        size="sm"
        :disabled="pending"
        @click="onVisible(false)"
      >
        {{ t('button.cancel') }}
      </Button>
      <Button
        type="submit"
        form="liaison-member-password-form"
        variant="primary"
        size="sm"
        :disabled="pending"
      >
        {{ t('settings-page.liaisons-password-submit') }}
      </Button>
    </template>
  </BaseModal>
</template>
