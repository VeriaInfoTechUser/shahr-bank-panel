<script setup lang="ts">
import { computed } from 'vue';
import { useFormValues } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';

type DomainNode = Record<string, unknown> & { children?: DomainNode[] };
type Option = { value: string; label: string };

const props = defineProps<{
  domainTree: DomainNode[];
  domainOptions: Option[];
}>();

const { t } = useI18n();
const values = useFormValues();

const subjectOptions = computed<Option[]>(() => {
  const domainId = String(values.value.standard_id ?? '');
  if (!domainId) return [];
  const domain = props.domainTree.find((d) => String(d.id) === domainId);
  const children = Array.isArray(domain?.children) ? domain.children : [];
  return children
    .map((c) => ({
      value: String(c.id ?? c.slug ?? ''),
      label: String(c.title ?? c.name ?? c.id ?? ''),
    }))
    .filter((x) => x.value);
});
</script>

<template>
  <BaseSelect
    name="standard_id"
    compact-label
    :label="t('task.filter-field-domain')"
    :options="domainOptions"
    placeholder=""
    :filter="true"
  />
  <BaseMultiSelect
    name="section_ids"
    compact-label
    :label="t('task.filter-field-section')"
    :options="subjectOptions"
    placeholder=""
    :disabled="subjectOptions.length === 0"
  />
</template>
