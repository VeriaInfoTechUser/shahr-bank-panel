<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import BaseDatePicker from '@/core/ui/base/BaseDatePicker.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { grcRepo, type GrcEntity, type GrcCreatePlan, type PlanControlAssignment } from '@/core/repositories/grcRepo';
import { ermRepo } from '@/core/repositories/ermRepo';

interface MemberOption {
  value: string;
  label: string;
}

interface ControlItem {
  slug: string;
  title: string;
  summary: string | null;
  frameworkSlug: string | null;
  domainSlug: string | null;
}

interface ControlAssignment {
  controlSlug: string;
  controlTitle: string;
  assigneeId: string;
  deadline: string;
}

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t, locale } = useI18n();
const isRtl = computed(() => ['fa', 'ar'].includes(String(locale.value).slice(0, 2)));
const currentStep = ref(1);
const saving = ref(false);

const memberOptions = ref<MemberOption[]>([]);
const membersLoading = ref(false);

const frameworkOptions = ref<{ value: string; label: string }[]>([]);
const frameworksLoading = ref(false);

const domainOptions = ref<{ value: string; label: string }[]>([]);
const domainsLoading = ref(false);

const controlsList = ref<ControlItem[]>([]);
const controlsLoading = ref(false);
const selectedControlSlugs = ref<string[]>([]);

const controlAssignments = ref<ControlAssignment[]>([]);

const step1Values = ref({
  title: '',
  deadline: '',
  owner_id: '',
  framework_slug: '',
  domain_slug: '',
});

const step1FormKey = ref(0);

const step1Schema = computed(() =>
  yup.object({
    title: yup.string().trim().required(t('validation.required')),
    deadline: yup.string().trim().required(t('validation.required')),
    owner_id: yup.string().trim().required(t('validation.required')),
    framework_slug: yup.string().trim().required(t('validation.required')),
    domain_slug: yup.string().trim().optional(),
  })
);

const step1Initial = computed(() => ({ ...step1Values.value }));

const STEPS = [
  { key: 1, labelKey: 'plan.wizard-step-info' },
  { key: 2, labelKey: 'plan.wizard-step-controls' },
  { key: 3, labelKey: 'plan.wizard-step-assign' },
] as const;

const selectedFrameworkLabel = computed(() =>
  frameworkOptions.value.find((f) => f.value === step1Values.value.framework_slug)?.label ?? ''
);

const selectedOwnerLabel = computed(() =>
  memberOptions.value.find((m) => m.value === step1Values.value.owner_id)?.label ?? ''
);

function resetWizard() {
  currentStep.value = 1;
  saving.value = false;
  step1Values.value = {
    title: '',
    deadline: '',
    owner_id: '',
    framework_slug: '',
    domain_slug: '',
  };
  step1FormKey.value = 0;
  selectedControlSlugs.value = [];
  controlAssignments.value = [];
  controlsList.value = [];
  domainOptions.value = [];
}

watch(
  () => props.show,
  (visible) => {
    if (!visible) return;
    resetWizard();
    loadFrameworks();
    loadMembers();
  }
);

async function loadMembers() {
  membersLoading.value = true;
  try {
    const res = await ermRepo.memberList({ page: 1, limit: 500 });
    const list = (res?.data?.list ?? []) as Record<string, unknown>[];
    memberOptions.value = list
      .map((m) => {
        const id = m.id ?? m.user_id;
        if (id == null) return null;
        const label =
          [m.name, m.full_name, m.email, m.mobile]
            .find((x) => typeof x === 'string' && String(x).trim()) ?? String(id);
        return { value: String(id), label: String(label).trim() };
      })
      .filter((x): x is MemberOption => x != null);
  } catch {
    toast(t('plan.wizard-members-load-error'), { type: 'error' });
  } finally {
    membersLoading.value = false;
  }
}

async function loadFrameworks() {
  frameworksLoading.value = true;
  try {
    const res = await grcRepo.frameworkList({ page: 1, limit: 500 });
    const list = res?.data?.list ?? [];
    frameworkOptions.value = (Array.isArray(list) ? list : []).map((f: GrcEntity) => ({
      value: f.slug,
      label: f.title ?? f.slug,
    }));
  } catch {
    toast(t('plan.wizard-frameworks-load-error'), { type: 'error' });
  } finally {
    frameworksLoading.value = false;
  }
}

async function loadDomains(frameworkSlug: string) {
  if (!frameworkSlug) {
    domainOptions.value = [];
    return;
  }
  domainsLoading.value = true;
  try {
    const res = await grcRepo.domainList({ page: 1, limit: 500, frameworkSlug });
    const list = res?.data?.list ?? [];
    domainOptions.value = (Array.isArray(list) ? list : []).map((d: GrcEntity) => ({
      value: d.slug,
      label: d.title ?? d.slug,
    }));
  } catch {
    toast(t('plan.wizard-domains-load-error'), { type: 'error' });
  } finally {
    domainsLoading.value = false;
  }
}

async function loadControls() {
  controlsLoading.value = true;
  try {
    const params: Record<string, unknown> = {
      page: 1,
      limit: 1000,
      frameworkSlug: step1Values.value.framework_slug,
    };
    if (step1Values.value.domain_slug) {
      params.domainSlug = step1Values.value.domain_slug;
    }
    const res = await grcRepo.controlList(params);
    const list = res?.data?.list ?? [];
    controlsList.value = (Array.isArray(list) ? list : []).map((c: GrcEntity) => ({
      slug: c.slug,
      title: c.title ?? c.slug,
      summary: c.summary,
      frameworkSlug: c.frameworkSlug,
      domainSlug: c.domainSlug,
    }));
  } catch {
    toast(t('plan.wizard-controls-load-error'), { type: 'error' });
  } finally {
    controlsLoading.value = false;
  }
}

function onFrameworkChange(slug: string) {
  step1Values.value.framework_slug = slug;
  step1Values.value.domain_slug = '';
  domainOptions.value = [];
  if (slug) {
    loadDomains(slug);
  }
}

function close() {
  emit('update:show', false);
  emit('close');
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
  if (!v) emit('close');
}

function onStep1Submit(values: Record<string, unknown>) {
  step1Values.value = {
    title: String(values.title ?? ''),
    deadline: String(values.deadline ?? ''),
    owner_id: String(values.owner_id ?? ''),
    framework_slug: String(values.framework_slug ?? ''),
    domain_slug: String(values.domain_slug ?? ''),
  };
  currentStep.value = 2;
  loadControls();
}

function toggleControl(slug: string) {
  const idx = selectedControlSlugs.value.indexOf(slug);
  if (idx >= 0) {
    selectedControlSlugs.value.splice(idx, 1);
  } else {
    selectedControlSlugs.value.push(slug);
  }
}

function toggleAllControls() {
  if (selectedControlSlugs.value.length === controlsList.value.length) {
    selectedControlSlugs.value = [];
  } else {
    selectedControlSlugs.value = controlsList.value.map((c) => c.slug);
  }
}

function goToStep3() {
  if (selectedControlSlugs.value.length === 0) return;
  controlAssignments.value = selectedControlSlugs.value.map((slug) => {
    const ctrl = controlsList.value.find((c) => c.slug === slug);
    const existing = controlAssignments.value.find((a) => a.controlSlug === slug);
    return {
      controlSlug: slug,
      controlTitle: ctrl?.title ?? slug,
      assigneeId: existing?.assigneeId ?? step1Values.value.owner_id,
      deadline: existing?.deadline ?? step1Values.value.deadline,
    };
  });
  currentStep.value = 3;
}

function goBack() {
  if (currentStep.value > 1) currentStep.value -= 1;
}

function updateAssignmentAssignee(slug: string, assigneeId: string) {
  const a = controlAssignments.value.find((x) => x.controlSlug === slug);
  if (a) a.assigneeId = assigneeId;
}

function updateAssignmentDeadline(slug: string, deadline: string) {
  const a = controlAssignments.value.find((x) => x.controlSlug === slug);
  if (a) a.deadline = deadline;
}

async function onCreatePlan() {
  saving.value = true;
  try {
    const controls: PlanControlAssignment[] = controlAssignments.value.map((a) => ({
      controlSlug: a.controlSlug,
      assigneeId: a.assigneeId,
      deadline: a.deadline,
    }));

    const payload: GrcCreatePlan = {
      title: step1Values.value.title,
      deadline: step1Values.value.deadline,
      ownerId: step1Values.value.owner_id,
      frameworkSlug: step1Values.value.framework_slug,
      domainSlug: step1Values.value.domain_slug || undefined,
      controls,
    };

    const res = await grcRepo.planCreateWithControls(payload);
    if (res?.result) {
      toast(t('plan.add-success'), { type: 'success' });
      emit('success');
      close();
    } else {
      toast(res?.error?.[0] ?? t('plan.add-error'), { type: 'error' });
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
    :title="t('plan.wizard-title')"
    size="lg"
    @update:visible="onDialogVisible"
  >
    <div class="min-h-[24rem]">
      <!-- Stepper -->
      <nav class="mb-6 flex items-center gap-1">
        <template v-for="(step, idx) in STEPS" :key="step.key">
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition"
            :class="[
              currentStep === step.key
                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                : currentStep > step.key
                  ? 'text-primary/70'
                  : 'text-slate-400 dark:text-slate-500',
            ]"
            @click="currentStep > step.key ? (currentStep = step.key) : undefined"
          >
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
              :class="[
                currentStep === step.key
                  ? 'bg-primary text-white'
                  : currentStep > step.key
                    ? 'bg-primary/20 text-primary'
                    : 'bg-slate-200 text-slate-500 dark:bg-darkmode-600 dark:text-slate-400',
              ]"
            >
              <Lucide v-if="currentStep > step.key" icon="Check" class="h-3.5 w-3.5" />
              <span v-else>{{ step.key }}</span>
            </span>
            <span class="hidden sm:inline">{{ t(step.labelKey) }}</span>
          </button>
          <div
            v-if="idx < STEPS.length - 1"
            class="mx-1 h-px flex-1"
            :class="[
              currentStep > step.key
                ? 'bg-primary/30'
                : 'bg-slate-200 dark:bg-darkmode-600',
            ]"
          />
        </template>
      </nav>

      <!-- Step 1: Plan Information -->
      <Form
        v-if="currentStep === 1"
        :key="'step1-' + step1FormKey"
        id="plan-wizard-step1"
        :validation-schema="step1Schema"
        :initial-values="step1Initial"
        class="space-y-4"
        @submit="onStep1Submit"
      >
        <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
          {{ t('plan.wizard-step-info') }}
        </p>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BaseInput
            name="title"
            :label="t('plan.wizard-field-title')"
            :placeholder="t('plan.wizard-field-title-placeholder')"
            :required="true"
            autofocus
          />
          <BaseDatePicker
            name="deadline"
            :label="t('plan.wizard-field-deadline')"
            :required="true"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BaseSelect
            name="owner_id"
            :label="t('plan.wizard-field-owner')"
            :options="memberOptions"
            :placeholder="t('rule.form-select-placeholder')"
            :required="true"
            :filter="true"
            :disabled="membersLoading"
          />
          <BaseSelect
            name="framework_slug"
            :label="t('plan.wizard-field-framework')"
            :options="frameworkOptions"
            :placeholder="t('rule.form-select-placeholder')"
            :required="true"
            :filter="true"
            :disabled="frameworksLoading"
            @change="onFrameworkChange"
          />
        </div>

        <BaseSelect
          name="domain_slug"
          :label="t('plan.wizard-field-domain')"
          :options="domainOptions"
          :placeholder="t('plan.wizard-field-domain-placeholder')"
          :filter="true"
          :disabled="domainsLoading || domainOptions.length === 0"
        />
      </Form>

      <!-- Step 2: Select Controls -->
      <div v-else-if="currentStep === 2" class="space-y-4">
        <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
          {{ t('plan.wizard-step-controls') }}
        </p>

        <div
          v-if="controlsLoading"
          class="flex items-center justify-center py-12 text-xs text-slate-500"
        >
          <Lucide icon="Loader2" class="mr-2 h-4 w-4 animate-spin" />
          {{ t('general.loading') }}
        </div>

        <template v-else>
          <div
            v-if="controlsList.length === 0"
            class="py-12 text-center text-xs text-slate-400"
          >
            {{ t('general.no-data') }}
          </div>

          <template v-else>
            <div class="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-darkmode-600 dark:bg-darkmode-700">
              <label class="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  :checked="selectedControlSlugs.length === controlsList.length && controlsList.length > 0"
                  :indeterminate="selectedControlSlugs.length > 0 && selectedControlSlugs.length < controlsList.length"
                  @change="toggleAllControls"
                />
                <span class="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {{ selectedControlSlugs.length === controlsList.length
                    ? t('plan.wizard-controls-deselect-all')
                    : t('plan.wizard-controls-select-all')
                  }}
                </span>
              </label>
              <span class="text-xs text-slate-500 dark:text-slate-400">
                {{ t('plan.wizard-controls-selected', { count: selectedControlSlugs.length, total: controlsList.length }) }}
              </span>
            </div>

            <div class="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              <label
                v-for="ctrl in controlsList"
                :key="ctrl.slug"
                class="flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition"
                :class="[
                  selectedControlSlugs.includes(ctrl.slug)
                    ? 'border-primary/40 bg-primary/5 dark:border-primary/30 dark:bg-primary/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-darkmode-600 dark:bg-darkmode-800 dark:hover:border-darkmode-500',
                ]"
              >
                <input
                  type="checkbox"
                  class="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-primary focus:ring-primary"
                  :checked="selectedControlSlugs.includes(ctrl.slug)"
                  @change="toggleControl(ctrl.slug)"
                />
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {{ ctrl.title }}
                  </div>
                  <div
                    v-if="ctrl.summary"
                    class="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400"
                  >
                    {{ ctrl.summary }}
                  </div>
                  <div class="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                    <span v-if="ctrl.frameworkSlug">{{ ctrl.frameworkSlug }}</span>
                    <span v-if="ctrl.domainSlug">{{ ctrl.domainSlug }}</span>
                  </div>
                </div>
              </label>
            </div>
          </template>
        </template>
      </div>

      <!-- Step 3: Assign Controls -->
      <div v-else-if="currentStep === 3" class="space-y-4">
        <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
          {{ t('plan.wizard-step-assign') }}
        </p>

        <div class="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          <div
            v-for="assignment in controlAssignments"
            :key="assignment.controlSlug"
            class="rounded-lg border border-slate-200 bg-white p-3 dark:border-darkmode-600 dark:bg-darkmode-800"
          >
            <div class="mb-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
              {{ assignment.controlTitle }}
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div class="form-control w-full">
                <label class="label min-h-0 py-1">
                  <span class="label-text text-xs font-normal leading-snug">
                    {{ t('plan.wizard-field-assignee') }}
                  </span>
                </label>
                <Select
                  :model-value="assignment.assigneeId"
                  :options="memberOptions"
                  option-label="label"
                  option-value="value"
                  :placeholder="t('rule.form-select-placeholder')"
                  :filter="true"
                  append-to="body"
                  scroll-height="16rem"
                  panel-class="base-select-overlay-panel"
                  class="base-select-trigger select select-bordered w-full !h-8 !min-h-0 pl-0.5 ps-0 text-xs font-light leading-snug [&_.p-select-label]:flex [&_.p-select-label]:items-center [&_.p-select-label]:pl-0 [&_.p-select-label]:text-xs [&_.p-select-label]:font-light [&_.p-select-label.p-placeholder]:text-slate-400"
                  @update:model-value="(v: string) => updateAssignmentAssignee(assignment.controlSlug, v)"
                />
              </div>
              <div class="form-control w-full">
                <label class="label min-h-0 py-1">
                  <span class="label-text text-xs font-normal leading-snug">
                    {{ t('plan.wizard-field-control-deadline') }}
                  </span>
                </label>
                <Vue3PersianDatetimePicker
                  :model-value="assignment.deadline"
                  type="date"
                  :color="'rgb(var(--color-primary) / 1)'"
                  :format="'YYYY-MM-DD'"
                  :display-format="false ? 'jYYYY/jMM/jDD' : 'YYYY-MM-DD'"
                  :locale="'en'"
                  :auto-submit="true"
                  input-class="input input-bordered w-full !h-8 !min-h-0 py-1.5 px-2.5 text-xs font-light leading-snug"
                  placeholder="YYYY-MM-DD"
                  @update:model-value="(v: string) => updateAssignmentDeadline(assignment.controlSlug, v ?? '')"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <div class="text-xs text-slate-400 dark:text-slate-500">
          <template v-if="currentStep === 1">
            {{ selectedFrameworkLabel }}
          </template>
          <template v-else-if="currentStep === 2">
            {{ t('plan.wizard-controls-selected', { count: selectedControlSlugs.length, total: controlsList.length }) }}
          </template>
          <template v-else>
            {{ t('plan.wizard-assign-summary', { count: controlAssignments.length }) }}
          </template>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            @click="close"
          >
            {{ t('general.cancel') }}
          </Button>
          <Button
            v-if="currentStep > 1"
            type="button"
            variant="outline-secondary"
            size="sm"
            @click="goBack"
          >
            <Lucide :icon="isRtl ? 'ArrowRight' : 'ArrowLeft'" class="me-1 h-3.5 w-3.5" />
            {{ t('button.back') }}
          </Button>
          <Button
            v-if="currentStep === 1"
            type="submit"
            variant="primary"
            size="sm"
            form="plan-wizard-step1"
          >
            {{ t('plan.wizard-next') }}
            <Lucide :icon="isRtl ? 'ArrowLeft' : 'ArrowRight'" class="ms-1 h-3.5 w-3.5" />
          </Button>
          <Button
            v-else-if="currentStep === 2"
            type="button"
            variant="primary"
            size="sm"
            :disabled="selectedControlSlugs.length === 0"
            @click="goToStep3"
          >
            {{ t('plan.wizard-next') }}
            <Lucide :icon="isRtl ? 'ArrowLeft' : 'ArrowRight'" class="ms-1 h-3.5 w-3.5" />
          </Button>
          <Button
            v-else
            type="button"
            variant="primary"
            size="sm"
            :disabled="saving"
            @click="onCreatePlan"
          >
            <Lucide v-if="saving" icon="Loader2" class="me-1 h-3.5 w-3.5 animate-spin" />
            <Lucide v-else icon="Check" class="me-1 h-3.5 w-3.5" />
            {{ t('plan.wizard-create') }}
          </Button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script lang="ts">
import Select from 'primevue/select';
import Vue3PersianDatetimePicker from 'vue3-persian-datetime-picker';

export default {
  components: { Select, Vue3PersianDatetimePicker },
};
</script>
