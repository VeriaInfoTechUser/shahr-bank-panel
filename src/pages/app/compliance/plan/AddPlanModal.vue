<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import Button from '@/base-components/Button';
import { grcRepo, type GrcEntity } from '@/core/repositories/grcRepo';

const props = withDefaults(
  defineProps<{
    show: boolean;
    mode?: 'add' | 'edit';
    plan?: GrcEntity | Record<string, unknown> | null;
  }>(),
  {
    mode: 'add',
    plan: null,
  }
);

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();
const formRef = ref<InstanceType<typeof Form> | null>(null);
const saving = ref(false);
const formKey = ref(0);

const statusOptions = computed(() => [
  { value: '1', label: t('status.active') },
  { value: '0', label: t('status.inactive') },
]);

const stateOptions = computed(() => [
  { value: 'draft', label: t('state.draft') },
  { value: 'published', label: t('state.published') },
  { value: 'archived', label: t('state.archived') },
]);

const initialValues = ref({
  slug: '',
  title: '',
  number: '',
  summary: '',
  version: '',
  description: '',
  status: '1',
  state: 'draft',
});

const validationSchema = computed(() =>
  yup.object({
    slug: yup.string().trim().required(t('validation.required')),
    title: yup.string().trim().optional(),
    number: yup.string().trim().optional(),
    summary: yup.string().trim().optional(),
    version: yup.string().trim().optional(),
    description: yup.string().trim().optional(),
    status: yup.string().trim().required(t('validation.required')),
    state: yup.string().trim().required(t('validation.required')),
  })
);

watch(
  () => [props.show, props.mode, props.plan] as const,
  ([show, mode, p]) => {
    if (!show) return;
    if (mode === 'edit' && p) {
      initialValues.value = {
        slug: (p.slug as string) ?? '',
        title: (p.title as string) ?? '',
        number: (p.number as string) ?? '',
        summary: (p.summary as string) ?? '',
        version: (p.version as string) ?? '',
        description: (p.description as string) ?? '',
        status: String(p.status ?? 1),
        state: (p.state as string) ?? 'draft',
      };
    } else {
      initialValues.value = {
        slug: '',
        title: '',
        number: '',
        summary: '',
        version: '',
        description: '',
        status: '1',
        state: 'draft',
      };
    }
    formKey.value += 1;
  },
  { immediate: true }
);

function close() {
  emit('update:show', false);
  emit('close');
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
  if (!v) emit('close');
}

async function onSubmit(values: Record<string, unknown>) {
  saving.value = true;
  try {
    const { slug: _slug, ...rest } = {
      slug: String(values.slug ?? ''),
      title: String(values.title ?? ''),
      number: String(values.number ?? ''),
      summary: String(values.summary ?? ''),
      version: String(values.version ?? ''),
      description: String(values.description ?? ''),
      status: Number(values.status),
      state: String(values.state ?? 'draft'),
    };

    if (props.mode === 'edit' && props.plan) {
      const slug = (props.plan.slug as string) ?? _slug;
      const res = await grcRepo.planUpdate(slug, rest);
      if (res?.result) {
        toast(t('plan.edit-success'), { type: 'success' });
        emit('success');
        close();
      } else {
        toast(res?.error?.[0] ?? t('plan.edit-error'), { type: 'error' });
      }
    } else {
      const res = await grcRepo.planCreate({ slug: _slug, ...rest });
      if (res?.result) {
        toast(t('plan.add-success'), { type: 'success' });
        emit('success');
        close();
      } else {
        toast(res?.error?.[0] ?? t('plan.add-error'), { type: 'error' });
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('general.error');
    toast(message, { type: 'error' });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal
    :visible="show"
    :title="props.mode === 'edit' ? t('plan.edit') : t('plan.add')"
    @update:visible="onDialogVisible"
  >
    <Form
      :key="formKey"
      id="add-plan-modal-form"
      ref="formRef"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-3"
      @submit="onSubmit"
    >
      <div class="space-y-3">
        <BaseInput
          name="slug"
          :label="t('plan.slug')"
          :placeholder="t('plan.slug-placeholder')"
          :required="true"
          :disabled="props.mode === 'edit'"
        />
        <BaseInput
          name="title"
          :label="t('plan.title')"
          :placeholder="t('plan.title-placeholder')"
        />
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
        <BaseInput
          name="number"
          :label="t('plan.number')"
          :placeholder="t('plan.number-placeholder')"
        />
        <BaseInput
          name="version"
          :label="t('plan.version')"
          :placeholder="t('plan.version-placeholder')"
        />
        <BaseSelect
          name="status"
          :label="t('title.status')"
          :options="statusOptions"
          :required="true"
        />
        <BaseSelect
          name="state"
          :label="t('title.state')"
          :options="stateOptions"
          :required="true"
        />
      </div>
      <BaseInput
        name="summary"
        :label="t('plan.summary')"
        :placeholder="t('plan.summary-placeholder')"
      />
      <BaseInput
        name="description"
        :label="t('plan.description')"
        type="textarea"
        :rows="3"
        :placeholder="t('plan.description-placeholder')"
      />
    </Form>
    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          :disabled="saving"
          @click="close"
        >
          {{ t('general.cancel') }}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          form="add-plan-modal-form"
          :disabled="saving"
        >
          {{ props.mode === 'edit' ? t('title.update') : t('title.register') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
