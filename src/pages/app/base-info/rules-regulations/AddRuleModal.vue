<script setup lang="ts">
import { watch, ref, computed, nextTick } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import * as yup from 'yup';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import { ermRepo } from '@/core/repositories/ermRepo';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t, locale } = useI18n();

const formRef = ref<InstanceType<typeof Form> | null>(null);

const validationSchema = computed(() =>
  yup.object({
    rule: yup.string().required(t('rule.validation-rule-required')),
    code: yup.string().required(t('rule.validation-code-required')),
    category: yup.string().required(t('rule.validation-category-required')),
    type: yup.string().required(t('rule.validation-type-required')),
    author: yup.string().required(t('rule.validation-author-required')),
    approval_at: yup.string().required(t('rule.validation-approval-at-required')),
    promulgation_at: yup.string().required(t('rule.validation-promulgation-at-required')),
    cancellation_at: yup.string().optional(),
    is_creditable: yup.boolean(),
    requirement: yup.boolean(),
  })
);

watch(locale, async () => {
  await nextTick();
  const exposed = formRef.value as { validate?: () => Promise<unknown> } | null;
  await exposed?.validate?.();
});

const optionsLoading = ref(true);
const saving = ref(false);
const formKey = ref(0);
const categoryOptions = ref<{ value: string; label: string }[]>([]);
const typeOptions = ref<{ value: string; label: string }[]>([]);
const authorOptions = ref<{ value: string; label: string }[]>([]);

function normalizeList(res: unknown): { value: string; label: string }[] {
  const r = res as { data?: { list?: unknown[] } | unknown[] };
  let list: unknown[] = [];
  const d = r?.data;
  if (Array.isArray(d)) list = d;
  else if (
    d &&
    typeof d === 'object' &&
    'list' in d &&
    Array.isArray((d as { list: unknown[] }).list)
  ) {
    list = (d as { list: unknown[] }).list;
  }
  return list
    .map((item) => {
      const row = item as Record<string, unknown>;
      const value = String(row.value ?? row.slug ?? row.id ?? '');
      const label = String(row.title ?? row.name ?? value);
      return { value, label };
    })
    .filter((x) => x.value);
}

const listParams = { page: 1, limit: 500, api_version: 8 };

async function loadOptions() {
  optionsLoading.value = true;
  try {
    const [catRes, typeRes, authorRes] = await Promise.all([
      ermRepo.ruleCategoryList(listParams),
      ermRepo.ruleTypeList(listParams),
      ermRepo.ruleAuthorList(listParams),
    ]);
    categoryOptions.value = normalizeList(catRes);
    typeOptions.value = normalizeList(typeRes);
    authorOptions.value = normalizeList(authorRes);
  } catch {
    toast(t('rule.form-load-options-error'), { type: 'error' });
    categoryOptions.value = [];
    typeOptions.value = [];
    authorOptions.value = [];
  } finally {
    optionsLoading.value = false;
  }
}

watch(
  () => props.show,
  (v) => {
    if (v) {
      formKey.value += 1;
      void loadOptions();
    }
  },
  { immediate: true }
);

const initialValues = {
  rule: '',
  code: '',
  category: '',
  type: '',
  author: '',
  approval_at: '',
  promulgation_at: '',
  cancellation_at: '',
  is_creditable: false,
  requirement: false,
};

function close() {
  emit('update:show', false);
  emit('close');
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
  if (!v) {
    emit('close');
  }
}

async function onSubmit(values: Record<string, unknown>) {
  saving.value = true;
  try {
    const cancellation = values.cancellation_at;
    const payload: Record<string, unknown> = {
      rule: values.rule,
      code: values.code,
      category: values.category,
      type: values.type,
      author: values.author,
      approval_at: values.approval_at,
      promulgation_at: values.promulgation_at,
      requirement: values.requirement ? 1 : 0,
      is_creditable: values.is_creditable ? 1 : 0,
      validity: values.is_creditable ? 1 : 0,
    };
    if (typeof cancellation === 'string' && cancellation.trim() !== '') {
      payload.cancellation_at = cancellation;
    }

    const result = await ermRepo.addRule(payload);
    if (result?.result) {
      toast(t('rule.form-add-success'), { type: 'success' });
      emit('success');
      close();
    } else {
      toast(String(result?.error?.message ?? t('rule.form-add-error')), {
        type: 'error',
      });
    }
  } catch (e) {
    toast(e instanceof Error ? e.message : t('rule.form-add-error'), {
      type: 'error',
    });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal
    :visible="show"
    :title="t('rule.modal-add-title')"
    @update:visible="onDialogVisible"
  >
    <div v-if="optionsLoading" class="py-8 text-center text-sm text-slate-500">
      {{ t('general.loading') }}
    </div>
    <Form
      v-else
      id="add-rule-modal-form"
      ref="formRef"
      :key="formKey"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-3"
      @submit="onSubmit"
    >
      <div class="min-w-0 [&_input]:max-w-full [&_input]:truncate">
        <BaseInput
          name="rule"
          type="text"
          :label="t('rule.form-rule')"
          :required="true"
          :autofocus="true"
        />
      </div>
      <div
        class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3"
      >
        <BaseInput
          name="code"
          :label="t('rule.form-code')"
          :required="true"
        />
        <BaseSelect
          name="category"
          :label="t('rule.form-category')"
          :options="categoryOptions"
          :placeholder="t('rule.form-select-placeholder')"
          :required="true"
          :disabled="categoryOptions.length === 0"
        />
        <BaseSelect
          name="type"
          :label="t('rule.form-type')"
          :options="typeOptions"
          :placeholder="t('rule.form-select-placeholder')"
          :required="true"
          :disabled="typeOptions.length === 0"
        />
        <BaseSelect
          name="author"
          :label="t('rule.form-author')"
          :options="authorOptions"
          :placeholder="t('rule.form-select-placeholder')"
          :required="true"
          :disabled="authorOptions.length === 0"
        />
        <BaseInput
          name="approval_at"
          type="date"
          :label="t('rule.approval-at')"
          :required="true"
        />
        <BaseInput
          name="promulgation_at"
          type="date"
          :label="t('rule.promulgation-at')"
          :required="true"
        />
        <div
          class="md:col-span-2 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:items-end"
        >
          <BaseInput
            name="cancellation_at"
            type="date"
            :label="t('rule.cancellation-at')"
          />
          <div class="flex min-w-0 flex-col gap-1 md:pb-0.5">
            <div
              class="flex flex-row flex-wrap items-center gap-x-5 gap-y-1"
            >
              <Field
                v-slot="{ value, handleChange }"
                name="is_creditable"
                type="checkbox"
              >
                <label class="flex cursor-pointer items-center gap-1.5 whitespace-nowrap">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :checked="!!value"
                    @change="handleChange(($event.target as HTMLInputElement).checked)"
                  />
                  <span class="text-xs">{{ t('rule.form-creditable') }}</span>
                </label>
              </Field>
              <Field
                v-slot="{ value, handleChange }"
                name="requirement"
                type="checkbox"
              >
                <label class="flex cursor-pointer items-center gap-1.5 whitespace-nowrap">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :checked="!!value"
                    @change="handleChange(($event.target as HTMLInputElement).checked)"
                  />
                  <span class="text-xs">{{ t('rule.form-requirement') }}</span>
                </label>
              </Field>
            </div>
            <ErrorMessage
              name="is_creditable"
              class="text-xs text-error"
            />
          </div>
        </div>
      </div>
    </Form>
    <template #footer>
      <div
        v-if="!optionsLoading"
        class="flex flex-wrap justify-end gap-2"
      >
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="saving"
          @click="close"
        >
          {{ t('rule.form-cancel') }}
        </button>
        <button
          type="submit"
          class="btn btn-primary btn-sm"
          form="add-rule-modal-form"
          :disabled="saving"
        >
          {{ t('rule.form-submit') }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>
