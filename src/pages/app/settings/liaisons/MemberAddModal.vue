<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { ermRepo } from '@/core/repositories/ermRepo';

type Option = { value: string; label: string };

const props = withDefaults(
  defineProps<{
    show: boolean;
    mode?: 'add' | 'edit';
    /** ردیف جدول در حالت ویرایش */
    member?: Record<string, unknown> | null;
  }>(),
  {
    mode: 'add',
    member: null,
  }
);

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();

const optionsLoading = ref(true);
const saving = ref(false);
const formKey = ref(0);
const hidePassword = ref(true);

const roleOptions = ref<Option[]>([]);
const mandatoryUnitOptions = ref<Option[]>([]);
const mandatoryUnitsRaw = ref<Record<string, unknown>[]>([]);

const isAdd = computed(() => props.mode === 'add');
const isEdit = computed(() => props.mode === 'edit');

const modalTitle = computed(() =>
  isEdit.value
    ? t('settings-page.liaisons-edit-modal-title')
    : t('settings-page.liaisons-add-modal-title')
);

const formIdAdd = computed(() => `member-form-add-${formKey.value}`);
const formIdEdit = computed(() => `member-form-edit-${formKey.value}`);
const activeFormId = computed(() =>
  isEdit.value ? formIdEdit.value : formIdAdd.value
);

function looseStr(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v == null) continue;
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  }
  return '';
}

function pickFirstName(row: Record<string, unknown>): string {
  const f = looseStr(row, 'first_name');
  if (f) return f;
  const full = looseStr(row, 'name', 'full_name');
  if (!full) return '';
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return parts[0] ?? '';
  return full;
}

function pickLastName(row: Record<string, unknown>): string {
  const l = looseStr(row, 'last_name');
  if (l) return l;
  const full = looseStr(row, 'name', 'full_name');
  if (!full) return '';
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return parts.slice(1).join(' ');
  return '';
}

function extractRoleSlugsFromRow(row: Record<string, unknown>): string[] {
  const roles = row.roles;
  if (!roles || typeof roles !== 'object') return [];
  const slugs: string[] = [];
  for (const key of Object.keys(roles as object)) {
    const arr = (roles as Record<string, unknown>)[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        const s = o.role ?? o.name;
        if (typeof s === 'string' && s.trim()) slugs.push(s.trim());
      }
    }
  }
  return slugs;
}

const editInitialValues = computed(() => {
  const row = props.member ?? {};
  return {
    first_name: pickFirstName(row),
    last_name: pickLastName(row),
    role_slugs: extractRoleSlugsFromRow(row),
  };
});

function extractErmList(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  const r = res as { data?: unknown; list?: unknown[] };
  const d = r?.data;
  if (Array.isArray(d)) return d as Record<string, unknown>[];
  if (
    d &&
    typeof d === 'object' &&
    'list' in d &&
    Array.isArray((d as { list: unknown[] }).list)
  ) {
    return (d as { list: Record<string, unknown>[] }).list;
  }
  if (Array.isArray(r?.list)) return r.list as Record<string, unknown>[];
  return [];
}

function mapRowsToIdFirstOptions(rows: Record<string, unknown>[]): Option[] {
  return rows
    .map((row) => {
      const value = String(row.id ?? row.value ?? row.slug ?? '');
      const label = String(row.title ?? row.name ?? value);
      return { value, label };
    })
    .filter((x) => x.value);
}

function isPasswordValid(p: string): boolean {
  if (p.length < 12) return false;
  if (!/[a-z]/.test(p)) return false;
  if (!/[A-Z]/.test(p)) return false;
  if (!/[0-9]/.test(p)) return false;
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p)) return false;
  return true;
}

function normalizeIranMobileToE164(raw: string): string | null {
  const s = raw.trim().replace(/[\s\u200c\-]/g, '');
  if (!s) return null;
  let d = s.replace(/\D/g, '');
  if (d.startsWith('98')) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);
  if (d.length === 10 && /^9\d{9}$/.test(d)) return `+98${d}`;
  return null;
}

function isValidIranMobileInput(raw: string): boolean {
  const v = String(raw ?? '').trim();
  if (!v) return true;
  return normalizeIranMobileToE164(v) !== null;
}

function buildMandatoryUnitPayload(
  ids: string[]
): { id: number; slug: string; title: string }[] {
  return ids
    .map((raw) => String(raw ?? '').trim())
    .filter(Boolean)
    .map((id) => {
      const row = mandatoryUnitsRaw.value.find(
        (x) =>
          String(x.id) === id ||
          String(x.slug ?? '') === id ||
          String(x.value ?? '') === id
      );
      if (!row || row.id == null) return null;
      const nid = Number(row.id);
      if (!Number.isFinite(nid)) return null;
      return {
        id: nid,
        slug: String(row.slug ?? ''),
        title: String(row.title ?? row.name ?? ''),
      };
    })
    .filter((x): x is { id: number; slug: string; title: string } => x != null);
}

const initialValuesAdd = {
  first_name: '',
  last_name: '',
  mobile: '',
  email: '',
  identity: '',
  credential: '',
  role_slugs: [] as string[],
  mandatory_unit_ids: [] as string[],
};

const validationSchemaAdd = computed(() =>
  yup.object({
    first_name: yup
      .string()
      .trim()
      .required(t('settings-page.liaisons-add-validation-first-name')),
    last_name: yup
      .string()
      .trim()
      .required(t('settings-page.liaisons-add-validation-last-name')),
    mobile: yup.string().test(
      'ir-mobile',
      t('settings-page.liaisons-add-validation-mobile'),
      (val) => isValidIranMobileInput(String(val ?? ''))
    ),
    email: yup.string().test(
      'email-opt',
      t('settings-page.liaisons-add-validation-email'),
      (val) => {
        const v = (val ?? '').trim();
        if (!v) return true;
        return yup.string().email().isValidSync(v);
      }
    ),
    identity: yup
      .string()
      .trim()
      .required(t('settings-page.liaisons-add-validation-identity-required'))
      .min(3, t('settings-page.liaisons-add-validation-identity-min'))
      .matches(
        /^[a-zA-Z0-9_.-]+$/,
        t('settings-page.liaisons-add-validation-identity-latin')
      ),
    credential: yup
      .string()
      .required(t('settings-page.liaisons-password-required'))
      .test(
        'policy',
        t('settings-page.liaisons-password-invalid'),
        (val) => isPasswordValid(val ?? '')
      ),
    role_slugs: yup
      .array()
      .of(yup.string())
      .min(1, t('settings-page.liaisons-add-validation-roles-required')),
    mandatory_unit_ids: yup.array().of(yup.string()).default([]),
  })
);

const validationSchemaEdit = computed(() =>
  yup.object({
    first_name: yup
      .string()
      .trim()
      .required(t('settings-page.liaisons-add-validation-first-name')),
    last_name: yup
      .string()
      .trim()
      .required(t('settings-page.liaisons-add-validation-last-name')),
    role_slugs: yup
      .array()
      .of(yup.string())
      .min(1, t('settings-page.liaisons-add-validation-roles-required')),
  })
);

function mapRoleListResponse(rolesRes: unknown) {
  const flat = extractErmList(rolesRes);
  roleOptions.value = flat
    .map((item) => {
      const row = item as Record<string, unknown>;
      const name = row.name != null ? String(row.name) : '';
      if (!name) return null;
      return {
        value: name,
        label: String(row.title ?? row.name ?? name),
      };
    })
    .filter((x): x is Option => x != null);
}

async function loadOptions() {
  optionsLoading.value = true;
  try {
    const listParams = { page: 1, limit: 500 };
    if (props.mode === 'edit') {
      const rolesRes = await ermRepo.roleList(listParams);
      mapRoleListResponse(rolesRes);
      mandatoryUnitsRaw.value = [];
      mandatoryUnitOptions.value = [];
    } else {
      const [rolesRes, mandatoryRes] = await Promise.all([
        ermRepo.roleList(listParams),
        ermRepo.mandatoryUnitList(listParams),
      ]);
      mapRoleListResponse(rolesRes);
      mandatoryUnitsRaw.value = extractErmList(mandatoryRes);
      mandatoryUnitOptions.value = mapRowsToIdFirstOptions(mandatoryUnitsRaw.value);
    }
  } catch {
    toast(t('settings-page.liaisons-add-load-options-error'), { type: 'error' });
    roleOptions.value = [];
    mandatoryUnitsRaw.value = [];
    mandatoryUnitOptions.value = [];
  } finally {
    optionsLoading.value = false;
  }
}

watch(
  () => props.show,
  (v) => {
    if (v) {
      formKey.value += 1;
      hidePassword.value = true;
      void loadOptions();
    }
  },
  { immediate: true }
);

function onDialogVisible(open: boolean) {
  emit('update:show', open);
}

async function onSubmitAdd(values: Record<string, unknown>) {
  saving.value = true;
  try {
    const mobileE164 = normalizeIranMobileToE164(String(values.mobile ?? ''));
    const emailStr = String(values.email ?? '').trim();
    const rawRole = Array.isArray(values.role_slugs)
      ? (values.role_slugs as unknown[]).map((x) => String(x ?? '')).filter(Boolean)
      : [];
    const rawMu = Array.isArray(values.mandatory_unit_ids)
      ? (values.mandatory_unit_ids as unknown[]).map((x) => String(x ?? '')).filter(Boolean)
      : [];

    const payload: Record<string, unknown> = {
      first_name: String(values.first_name ?? '').trim(),
      last_name: String(values.last_name ?? '').trim(),
      identity: String(values.identity ?? '').trim(),
      credential: String(values.credential ?? ''),
      /**
       * AccountRepository::addAccount — ستون `signature` در DB بدون default است.
       * رشتهٔ خالی ممکن است در PHP/لایهٔ میانی حذف شود و INSERT بدون این ستون خطای 1364 بدهد.
       */
      signature: '-',
      roles: rawRole.join(','),
      mandatory_unit: buildMandatoryUnitPayload(rawMu),
    };
    if (emailStr) payload.email = emailStr;
    if (mobileE164) payload.mobile = mobileE164;

    const res = await ermRepo.memberAdd(payload);
    if (res?.result) {
      toast(t('settings-page.liaisons-add-success'), { type: 'success' });
      emit('success');
      emit('update:show', false);
    } else {
      toast(
        String(
          res?.error?.message ?? t('settings-page.liaisons-add-error')
        ),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error ? e.message : t('settings-page.liaisons-add-error'),
      { type: 'error' }
    );
  } finally {
    saving.value = false;
  }
}

async function onSubmitEdit(values: Record<string, unknown>) {
  const uid = Number(props.member?.id);
  if (!Number.isFinite(uid) || uid <= 0) {
    toast(t('settings-page.liaisons-edit-error'), { type: 'error' });
    return;
  }
  saving.value = true;
  try {
    const rawRole = Array.isArray(values.role_slugs)
      ? (values.role_slugs as unknown[]).map((x) => String(x ?? '')).filter(Boolean)
      : [];
    const payload: Record<string, unknown> = {
      user_id: uid,
      first_name: String(values.first_name ?? '').trim(),
      last_name: String(values.last_name ?? '').trim(),
      roles: rawRole.join(','),
    };
    const res = await ermRepo.memberUpdate(payload);
    if (res?.result) {
      toast(t('settings-page.liaisons-edit-success'), { type: 'success' });
      emit('success');
      emit('update:show', false);
    } else {
      toast(
        String(
          res?.error?.message ?? t('settings-page.liaisons-edit-error')
        ),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error ? e.message : t('settings-page.liaisons-edit-error'),
      { type: 'error' }
    );
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal
    :visible="show"
    size="sm"
    :title="modalTitle"
    content-class="max-h-[min(88vh,720px)] overflow-y-auto p-4"
    @update:visible="onDialogVisible"
  >
    <div
      v-if="optionsLoading"
      class="py-10 text-center text-sm text-slate-500 dark:text-slate-400"
    >
      {{ t('general.loading') }}
    </div>

    <!-- افزودن -->
    <Form
      v-else-if="isAdd"
      :id="formIdAdd"
      :key="`${formKey}-add`"
      :validation-schema="validationSchemaAdd"
      :initial-values="initialValuesAdd"
      class="space-y-3"
      @submit="onSubmitAdd"
    >
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4">
        <BaseInput
          name="first_name"
          :label="t('settings-page.liaisons-add-first-name')"
          :placeholder="t('settings-page.liaisons-add-first-name')"
          :required="true"
          :autofocus="true"
        />
        <BaseInput
          name="last_name"
          :label="t('settings-page.liaisons-add-last-name')"
          :placeholder="t('settings-page.liaisons-add-last-name')"
          :required="true"
        />
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4">
        <div class="min-w-0 md:col-span-1">
          <BaseInput
            name="mobile"
            type="tel"
            input-dir="ltr"
            digit-display="persian"
            :label="t('settings-page.liaisons-add-mobile')"
            :placeholder="t('settings-page.liaisons-add-mobile-placeholder')"
            autocomplete="tel"
          />
        </div>
        <div class="min-w-0 md:col-span-1">
          <BaseInput
            name="email"
            type="email"
            input-dir="ltr"
            :label="t('settings-page.liaisons-add-email')"
            :placeholder="t('settings-page.liaisons-add-email-placeholder')"
            autocomplete="email"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4">
        <div class="min-w-0 md:col-span-1">
          <BaseInput
            name="identity"
            input-dir="ltr"
            :label="t('settings-page.liaisons-add-identity')"
            :placeholder="t('settings-page.liaisons-add-identity-placeholder')"
            :required="true"
            autocomplete="username"
          />
        </div>
        <div class="form-control flex min-w-0 flex-col md:col-span-1">
          <label class="label min-h-0 py-1" for="member-add-credential">
            <span class="label-text text-sm font-normal leading-snug text-slate-700 dark:text-slate-200">
              {{ t('settings-page.liaisons-add-password-label') }}
              <span class="text-error">*</span>
            </span>
          </label>
          <Field name="credential" v-slot="{ field, errors }">
            <div class="relative flex w-full" dir="ltr">
              <button
                type="button"
                class="flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-l-md border px-3 transition-colors"
                :class="
                  errors.length > 0
                    ? 'border-error bg-error/10 text-error'
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
                id="member-add-credential"
                v-bind="field"
                class="input input-bordered w-full min-w-0 flex-1 !h-8 rounded-none rounded-r-md border-l-0 py-1.5 px-2.5 text-xs font-light leading-snug dark:border-darkmode-600"
                :class="{ 'input-error': errors.length > 0 }"
                :type="hidePassword ? 'password' : 'text'"
                autocomplete="new-password"
                :placeholder="t('settings-page.liaisons-password-field-placeholder')"
              />
            </div>
            <ErrorMessage
              name="credential"
              class="mt-1 block text-xs text-error"
            />
            <p
              class="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400"
            >
              {{ t('settings-page.liaisons-add-password-hint-short') }}
            </p>
          </Field>
        </div>
      </div>

      <BaseMultiSelect
        name="mandatory_unit_ids"
        :label="t('settings-page.liaisons-add-mandatory-units')"
        :options="mandatoryUnitOptions"
        :placeholder="t('rule.form-select-placeholder')"
        :disabled="mandatoryUnitOptions.length === 0"
      />

      <BaseMultiSelect
        name="role_slugs"
        :label="t('settings-page.liaisons-add-roles')"
        :options="roleOptions"
        :placeholder="t('rule.form-select-placeholder')"
        :required="true"
        :disabled="roleOptions.length === 0"
      />
    </Form>

    <!-- ویرایش -->
    <Form
      v-else-if="isEdit"
      :id="formIdEdit"
      :key="`${formKey}-edit`"
      :validation-schema="validationSchemaEdit"
      :initial-values="editInitialValues"
      class="space-y-3"
      @submit="onSubmitEdit"
    >
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4">
        <BaseInput
          name="first_name"
          :label="t('settings-page.liaisons-add-first-name')"
          :placeholder="t('settings-page.liaisons-add-first-name')"
          :required="true"
          :autofocus="true"
        />
        <BaseInput
          name="last_name"
          :label="t('settings-page.liaisons-add-last-name')"
          :placeholder="t('settings-page.liaisons-add-last-name')"
          :required="true"
        />
      </div>
      <BaseMultiSelect
        name="role_slugs"
        :label="t('settings-page.liaisons-add-roles')"
        :options="roleOptions"
        :placeholder="t('rule.form-select-placeholder')"
        :required="true"
        :disabled="roleOptions.length === 0"
      />
    </Form>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          :disabled="saving"
          @click="onDialogVisible(false)"
        >
          {{ t('button.cancel') }}
        </Button>
        <Button
          v-if="!optionsLoading"
          type="submit"
          variant="primary"
          size="sm"
          :form="activeFormId"
          :disabled="saving"
        >
          {{
            isEdit
              ? t('settings-page.liaisons-edit-submit')
              : t('settings-page.liaisons-add-submit')
          }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
