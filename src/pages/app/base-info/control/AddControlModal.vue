<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { Form, useForm } from 'vee-validate';
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
    control?: GrcEntity | Record<string, unknown> | null;
  }>(),
  {
    mode: 'add',
    control: null,
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
const domains = ref<GrcEntity[]>([]);
const selectedFrameworkSlug = ref('');

const { setFieldValue } = useForm();

const frameworkOptions = computed<Option[]>(() =>
  frameworks.value.map((fw) => ({
    value: fw.slug,
    label: fw.title ?? fw.slug,
  }))
);

const domainOptions = computed<Option[]>(() => {
  const fwSlug = selectedFrameworkSlug.value;
  const filtered = fwSlug ? domains.value.filter((d) => d.frameworkSlug === fwSlug) : domains.value;
  return filtered.map((d) => ({
    value: d.slug,
    label: d.title ?? d.slug,
  }));
});

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
  domainSlug: '',
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
    domainSlug: yup.string().trim().required(t('validation.required')),
  })
);

onMounted(async () => {
  try {
    const [fwRes, domRes] = await Promise.all([
      grcRepo.frameworkList({ limit: 100 }),
      grcRepo.domainList({ limit: 100 }),
    ]);
    if (fwRes?.result && fwRes.data?.list) {
      frameworks.value = fwRes.data.list;
    }
    if (domRes?.result && domRes.data?.list) {
      domains.value = domRes.data.list;
    }
  } catch (err) {
    console.error('Failed to load frameworks/domains:', err);
  }
});

watch(
  () => [props.show, props.mode, props.control] as const,
  ([show, mode, c]) => {
    if (!show) return;
    if (mode === 'edit' && c) {
      initialValues.value = {
        slug: (c.slug as string) ?? '',
        title: (c.title as string) ?? '',
        number: (c.number as string) ?? '',
        summary: (c.summary as string) ?? '',
        version: (c.version as string) ?? '',
        description: (c.description as string) ?? '',
        status: String(c.status ?? 1),
        state: (c.state as string) ?? 'draft',
        frameworkSlug: (c.frameworkSlug as string) ?? '',
        domainSlug: (c.domainSlug as string) ?? '',
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
        domainSlug: '',
      };
    }
    formKey.value += 1;
    selectedFrameworkSlug.value = initialValues.value.frameworkSlug;
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

function onFrameworkChange(value: unknown) {
  selectedFrameworkSlug.value = String(value ?? '');
  setFieldValue('domainSlug', '');
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
      frameworkSlug: String(values.frameworkSlug ?? ''),
      domainSlug: String(values.domainSlug ?? ''),
      parentSlug: String(values.domainSlug ?? ''),
    };

    if (props.mode === 'edit' && props.control) {
      const slug = (props.control.slug as string) ?? _slug;
      const res = await grcRepo.controlUpdate(slug, rest);
      if (res?.result) {
        toast(t('control.edit-success'), { type: 'success' });
        emit('success');
        close();
      } else {
        toast(res?.error?.[0] ?? t('control.edit-error'), { type: 'error' });
      }
    } else {
      const res = await grcRepo.controlCreate({ slug: _slug, ...rest });
      if (res?.result) {
        toast(t('control.add-success'), { type: 'success' });
        emit('success');
        close();
      } else {
        toast(res?.error?.[0] ?? t('control.add-error'), { type: 'error' });
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
    :title="props.mode === 'edit' ? t('control.edit') : t('control.add')"
    @update:visible="onDialogVisible"
  >
    <Form
      :key="formKey"
      id="add-control-modal-form"
      ref="formRef"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-3"
      @submit="onSubmit"
    >
      <div class="space-y-3">
        <BaseInput
          name="slug"
          :label="t('control.slug')"
          :placeholder="t('control.slug-placeholder')"
          :required="true"
          :disabled="props.mode === 'edit'"
        />
        <BaseInput
          name="title"
          :label="t('control.title')"
          :placeholder="t('control.title-placeholder')"
        />
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
        <BaseSelect
          name="frameworkSlug"
          :label="t('control.framework')"
          :options="frameworkOptions"
          :placeholder="t('control.select-framework')"
          :required="true"
          :filter="true"
          @change="onFrameworkChange"
        />
        <BaseSelect
          name="domainSlug"
          :label="t('control.domain')"
          :options="domainOptions"
          :placeholder="t('control.select-domain')"
          :required="true"
          :filter="true"
        />
        <BaseInput
          name="number"
          :label="t('control.number')"
          :placeholder="t('control.number-placeholder')"
        />
        <BaseInput
          name="version"
          :label="t('control.version')"
          :placeholder="t('control.version-placeholder')"
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
        :label="t('control.summary')"
        :placeholder="t('control.summary-placeholder')"
      />
      <BaseInput
        name="description"
        :label="t('control.description')"
        type="textarea"
        :rows="3"
        :placeholder="t('control.description-placeholder')"
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
          form="add-control-modal-form"
          :disabled="saving"
        >
          {{ props.mode === 'edit' ? t('title.update') : t('title.register') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
