<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import Button from '@/base-components/Button';
import { grcRepo, type GrcEntity } from '@/core/repositories/grcRepo';

type Option = { value: string; label: string };

const props = withDefaults(
  defineProps<{
    show: boolean;
    mode?: 'add' | 'edit';
    domain?: GrcEntity | Record<string, unknown> | null;
  }>(),
  {
    mode: 'add',
    domain: null,
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
const frameworks = ref<GrcEntity[]>([]);

const frameworkOptions = computed<Option[]>(() =>
  frameworks.value.map((fw) => ({
    value: fw.slug,
    label: fw.title ?? fw.slug,
  }))
);

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
  frameworkSlug: '',
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
    frameworkSlug: yup.string().trim().required(t('validation.required')),
  })
);

onMounted(async () => {
  try {
    const res = await grcRepo.frameworkList({ limit: 100 });
    if (res?.result && res.data?.list) {
      frameworks.value = res.data.list;
    }
  } catch (err) {
    console.error('Failed to load frameworks:', err);
  }
});

watch(
  () => [props.show, props.mode, props.domain] as const,
  ([show, mode, d]) => {
    if (!show) return;
    if (mode === 'edit' && d) {
      initialValues.value = {
        slug: (d.slug as string) ?? '',
        title: (d.title as string) ?? '',
        number: (d.number as string) ?? '',
        summary: (d.summary as string) ?? '',
        version: (d.version as string) ?? '',
        description: (d.description as string) ?? '',
        status: String(d.status ?? 1),
        state: (d.state as string) ?? 'draft',
        frameworkSlug: (d.frameworkSlug as string) ?? '',
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
        frameworkSlug: '',
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
    const payload = {
      slug: String(values.slug ?? ''),
      title: String(values.title ?? ''),
      number: String(values.number ?? ''),
      summary: String(values.summary ?? ''),
      version: String(values.version ?? ''),
      description: String(values.description ?? ''),
      status: Number(values.status),
      state: String(values.state ?? 'draft'),
      frameworkSlug: String(values.frameworkSlug ?? ''),
      parentSlug: String(values.frameworkSlug ?? ''),
    };

    if (props.mode === 'edit' && props.domain) {
      const slug = (props.domain.slug as string) ?? payload.slug;
      const res = await grcRepo.domainUpdate(slug, payload);
      if (res?.result) {
        toast(t('domain.edit-success'), { type: 'success' });
        emit('success');
        close();
      } else {
        toast(res?.error?.[0] ?? t('domain.edit-error'), { type: 'error' });
      }
    } else {
      const res = await grcRepo.domainCreate(payload);
      if (res?.result) {
        toast(t('domain.add-success'), { type: 'success' });
        emit('success');
        close();
      } else {
        toast(res?.error?.[0] ?? t('domain.add-error'), { type: 'error' });
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
    :title="props.mode === 'edit' ? t('domain.edit') : t('domain.add')"
    @update:visible="onDialogVisible"
  >
    <Form
      :key="formKey"
      ref="formRef"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-3"
      @submit="onSubmit"
    >
      <div class="space-y-3">
        <BaseInput
          name="slug"
          :label="t('domain.slug')"
          :placeholder="t('domain.slug-placeholder')"
          :required="true"
          :disabled="props.mode === 'edit'"
        />
        <BaseInput
          name="title"
          :label="t('domain.title')"
          :placeholder="t('domain.title-placeholder')"
        />
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
        <BaseSelect
          name="frameworkSlug"
          :label="t('domain.framework')"
          :options="frameworkOptions"
          :placeholder="t('domain.select-framework')"
          :required="true"
          :filter="true"
        />
        <BaseInput
          name="number"
          :label="t('domain.number')"
          :placeholder="t('domain.number-placeholder')"
        />
        <BaseInput
          name="version"
          :label="t('domain.version')"
          :placeholder="t('domain.version-placeholder')"
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
        :label="t('domain.summary')"
        :placeholder="t('domain.summary-placeholder')"
      />
      <BaseInput
        name="description"
        :label="t('domain.description')"
        type="textarea"
        :rows="3"
        :placeholder="t('domain.description-placeholder')"
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
          :disabled="saving"
          @click="formRef?.requestSubmit()"
        >
          {{ props.mode === 'edit' ? t('title.update') : t('title.register') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
