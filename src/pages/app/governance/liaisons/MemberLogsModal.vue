<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import Button from '@/base-components/Button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { ermRepo } from '@/core/repositories/ermRepo';

const props = defineProps<{
  show: boolean;
  userId: number;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
}>();

const { t } = useI18n();

/** همیشه فقط ۲۵ لاگ اخیر (جدیدترین پس از مرتب‌سازی) */
const LOG_DISPLAY_LIMIT = 25;

const loading = ref(false);
const loadError = ref<string | null>(null);
const member = ref<Record<string, unknown> | null>(null);

/** تب اول: عملیات کاربر (user_log) — تب دوم: ورود/خروج سیستم (user_inventory) */
type TabId = 'ops' | 'inv';
const activeTab = ref<TabId>('ops');

const detailJsonOpen = ref(false);
const detailRow = ref<Record<string, unknown> | null>(null);

const detailJsonText = computed(() => {
  if (!detailRow.value) return '';
  try {
    return JSON.stringify(detailRow.value, null, 2);
  } catch {
    return String(detailRow.value);
  }
});

function openLogDetail(row: Record<string, unknown>) {
  detailRow.value = row;
  detailJsonOpen.value = true;
}

function closeLogDetail(v: boolean) {
  detailJsonOpen.value = v;
  if (!v) detailRow.value = null;
}

async function copyDetailJson() {
  const text = detailJsonText.value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast(t('settings-page.liaisons-logs-json-copied'), { type: 'success' });
  } catch {
    toast(t('settings-page.liaisons-logs-load-error'), { type: 'error' });
  }
}

function pickStr(...vals: unknown[]): string {
  for (const v of vals) {
    if (v == null) continue;
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  }
  return '—';
}

function operatorName(row: Record<string, unknown>): string {
  const info = row.information as Record<string, unknown> | undefined;
  const op = info?.operator as Record<string, unknown> | undefined;
  return pickStr(op?.name, op?.email);
}

async function loadMember() {
  if (!props.userId) {
    member.value = null;
    return;
  }
  loading.value = true;
  loadError.value = null;
  try {
    const res = await ermRepo.memberView({ user_id: props.userId });
    if (res?.result === false) {
      loadError.value =
        (res.error as { message?: string } | undefined)?.message ??
        t('settings-page.liaisons-logs-load-error');
      member.value = null;
      return;
    }
    const data = res?.data;
    member.value =
      data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  } catch {
    loadError.value = t('settings-page.liaisons-logs-load-error');
    member.value = null;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.show, props.userId] as const,
  ([open, uid]) => {
    if (open && uid) {
      activeTab.value = 'ops';
      loadMember();
    } else if (!open) {
      member.value = null;
      loadError.value = null;
      detailJsonOpen.value = false;
      detailRow.value = null;
    }
  },
  { immediate: true }
);

function displayMemberName(
  m: Record<string, unknown>,
  inf: Record<string, unknown>
): string {
  const full = pickStr(m.name, inf.name);
  if (full !== '—') return full;
  const fn = m.first_name ?? inf.first_name;
  const ln = m.last_name ?? inf.last_name;
  const parts = [fn, ln].filter((x) => x != null && String(x).trim() !== '');
  if (parts.length) return parts.map(String).join(' ');
  return '—';
}

const identityLines = computed(() => {
  const m = member.value;
  if (!m) return [];
  const inf = (m.information as Record<string, unknown>) || {};

  const lines: { label: string; value: string; ltr?: boolean }[] = [
    {
      label: t('settings-page.liaisons-logs-field-name'),
      value: displayMemberName(m, inf),
    },
  ];
  lines.push(
    {
      label: t('settings-page.liaisons-logs-field-email'),
      value: pickStr(m.email, inf.email),
      ltr: true,
    },
    {
      label: t('settings-page.liaisons-logs-field-mobile'),
      value: pickStr(m.mobile, inf.mobile),
      ltr: true,
    },
    {
      label: t('settings-page.liaisons-logs-field-identity'),
      value: pickStr(m.identity, inf.identity),
      ltr: true,
    },
    {
      label: t('settings-page.liaisons-logs-field-org'),
      value: pickStr(
        m.company_title,
        inf.company_title,
        (inf.organization as Record<string, unknown>)?.title
      ),
    },
    {
      label: t('settings-page.liaisons-logs-field-registered'),
      value: pickStr(m.time_created_view),
    }
  );
  return lines;
});

const userLogRows = computed(() => {
  const raw = member.value?.user_log;
  if (!Array.isArray(raw)) return [];
  const rows = raw.map((r, i) => {
    const o =
      typeof r === 'object' && r ? { ...(r as Record<string, unknown>) } : {};
    if (o.id == null) o.id = `log-${i}-${String(o.time_create ?? '')}`;
    return o;
  });
  rows.sort(
    (a, b) =>
      (Number(b.time_create) || 0) - (Number(a.time_create) || 0)
  );
  return rows.slice(0, LOG_DISPLAY_LIMIT);
});

const userInventoryRows = computed(() => {
  const raw = member.value?.user_inventory;
  if (!Array.isArray(raw)) return [];
  const rows = raw.map((r, i) => {
    const o =
      typeof r === 'object' && r ? { ...(r as Record<string, unknown>) } : {};
    if (o.id == null) o.id = `inv-${i}-${String(o.time_create ?? '')}`;
    return o;
  });
  rows.sort(
    (a, b) =>
      (Number(b.time_create) || 0) - (Number(a.time_create) || 0)
  );
  return rows.slice(0, LOG_DISPLAY_LIMIT);
});

function onVisible(v: boolean) {
  emit('update:show', v);
}
</script>

<template>
  <div>
    <BaseModal
      :visible="show"
      size="xl"
      :title="t('settings-page.liaisons-logs-modal-title')"
      content-class="flex max-h-[min(88vh,920px)] flex-col overflow-hidden p-3 sm:p-4"
      @update:visible="onVisible"
    >
      <div
        data-autofocus-modal
        class="flex min-h-0 flex-1 flex-col gap-3"
        tabindex="-1"
      >
        <p
          v-if="loading"
          class="shrink-0 py-2 text-sm text-slate-500 dark:text-slate-400"
        >
          {{ t('settings-page.liaisons-logs-loading') }}
        </p>

        <p
          v-else-if="loadError"
          class="shrink-0 py-2 text-sm text-amber-800 dark:text-amber-200/90"
        >
          {{ loadError }}
        </p>

        <template v-else-if="member">
          <section
            class="mb-3 shrink-0"
            :aria-label="t('settings-page.liaisons-logs-identity-section')"
          >
            <div
              class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div
                v-for="(line, idx) in identityLines"
                :key="idx"
                class="min-w-0"
              >
                <p
                  class="m-0 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[13px] leading-snug"
                >
                  <span
                    class="shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400"
                  >
                    {{ line.label }}:
                  </span>
                  <span
                    class="min-w-0 break-words font-semibold text-slate-900 dark:text-slate-100"
                    :class="line.ltr ? 'font-mono tracking-normal' : ''"
                    :dir="line.ltr ? 'ltr' : undefined"
                  >
                    {{ line.value }}
                  </span>
                </p>
              </div>
            </div>
          </section>

          <div
            class="flex min-h-0 flex-1 flex-col border-t border-slate-200/90 pt-3 dark:border-darkmode-600"
          >
            <div
              class="mb-2 flex w-full shrink-0 gap-0 border-b border-slate-200 dark:border-darkmode-600"
              role="tablist"
            >
              <button
                type="button"
                role="tab"
                class="min-w-0 flex-1 border-b-2 px-2 py-3 text-center text-sm font-medium transition-colors sm:px-4"
                :aria-selected="activeTab === 'ops'"
                :class="
                  activeTab === 'ops'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                "
                @click="activeTab = 'ops'"
              >
                {{ t('settings-page.liaisons-logs-tab-operations') }}
              </button>
              <button
                type="button"
                role="tab"
                class="min-w-0 flex-1 border-b-2 px-2 py-3 text-center text-sm font-medium transition-colors sm:px-4"
                :aria-selected="activeTab === 'inv'"
                :class="
                  activeTab === 'inv'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                "
                @click="activeTab = 'inv'"
              >
                {{ t('settings-page.liaisons-logs-tab-inventory') }}
              </button>
            </div>

            <div class="flex min-h-0 flex-1 flex-col overflow-auto">
              <!-- تب اول: گزارش عملیات کاربر (user_log) -->
              <DataTable
                v-show="activeTab === 'ops'"
                :value="userLogRows"
                :dataKey="'id'"
                striped-rows
                size="small"
                class="text-sm"
                :empty-message="t('general.no-data')"
              >
                <Column
                  field="time_create_view"
                  :header="t('settings-page.liaisons-logs-col-time')"
                  class="whitespace-nowrap"
                />
                <Column
                  field="state"
                  :header="t('settings-page.liaisons-logs-col-state')"
                />
                <Column
                  :header="t('settings-page.liaisons-logs-col-operator')"
                >
                  <template #body="{ data }">
                    {{ operatorName(data as Record<string, unknown>) }}
                  </template>
                </Column>
                <Column :header="t('settings-page.liaisons-logs-col-ip')">
                  <template #body="{ data }">
                    {{
                      pickStr(
                        (data as Record<string, unknown>).ip,
                        (
                          (data as Record<string, unknown>).information as
                            | Record<string, unknown>
                            | undefined
                        )?.ip
                      )
                    }}
                  </template>
                </Column>
                <Column :header="t('settings-page.liaisons-logs-col-method')">
                  <template #body="{ data }">
                    {{
                      pickStr(
                        (data as Record<string, unknown>).method,
                        (
                          (data as Record<string, unknown>).information as
                            | Record<string, unknown>
                            | undefined
                        )?.method
                      )
                    }}
                  </template>
                </Column>
                <Column
                  :header="t('settings-page.liaisons-logs-col-details')"
                  class="w-[1%] whitespace-nowrap"
                >
                  <template #body="{ data }">
                    <Button
                      type="button"
                      variant="outline-primary"
                      size="sm"
                      class="!h-7 !px-2 !text-xs"
                      @click.stop="
                        openLogDetail(data as Record<string, unknown>)
                      "
                    >
                      {{ t('settings-page.liaisons-logs-col-details') }}
                    </Button>
                  </template>
                </Column>
              </DataTable>

              <!-- تب دوم: گزارش ورود و خروج (user_inventory) -->
              <DataTable
                v-show="activeTab === 'inv'"
                :value="userInventoryRows"
                :dataKey="'id'"
                striped-rows
                size="small"
                class="text-sm"
                :empty-message="t('general.no-data')"
              >
                <Column
                  field="time_create_view"
                  :header="t('settings-page.liaisons-logs-col-time')"
                  class="whitespace-nowrap"
                />
                <Column
                  field="level"
                  :header="t('settings-page.liaisons-logs-col-level')"
                />
                <Column
                  field="message"
                  :header="t('settings-page.liaisons-logs-col-message')"
                />
                <Column
                  field="path"
                  :header="t('settings-page.liaisons-logs-col-path')"
                />
                <Column
                  field="ip"
                  :header="t('settings-page.liaisons-logs-col-ip')"
                />
                <Column
                  field="method"
                  :header="t('settings-page.liaisons-logs-col-method')"
                />
                <Column
                  :header="t('settings-page.liaisons-logs-col-details')"
                  class="w-[1%] whitespace-nowrap"
                >
                  <template #body="{ data }">
                    <Button
                      type="button"
                      variant="outline-primary"
                      size="sm"
                      class="!h-7 !px-2 !text-xs"
                      @click.stop="
                        openLogDetail(data as Record<string, unknown>)
                      "
                    >
                      {{ t('settings-page.liaisons-logs-col-details') }}
                    </Button>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </template>
      </div>

      <template #footer>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          @click="onVisible(false)"
        >
          {{ t('settings-page.liaisons-logs-close') }}
        </Button>
      </template>
    </BaseModal>

    <!-- مودال JSON رکورد -->
    <BaseModal
      :visible="detailJsonOpen"
      size="xl"
      :title="t('settings-page.liaisons-logs-json-modal-title')"
      content-class="flex max-h-[min(75vh,640px)] flex-col overflow-hidden p-3 sm:p-4"
      @update:visible="closeLogDetail"
    >
      <div class="flex min-h-0 flex-1 flex-col gap-2">
        <div class="flex shrink-0 justify-end gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            @click="copyDetailJson"
          >
            {{ t('settings-page.liaisons-logs-json-copy') }}
          </Button>
        </div>
        <textarea
          readonly
          dir="ltr"
          class="min-h-[280px] flex-1 resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800 shadow-inner dark:border-darkmode-600 dark:bg-darkmode-900 dark:text-slate-100"
          :value="detailJsonText"
          aria-label="JSON"
          @focus="($event.target as HTMLTextAreaElement).select()"
        />
      </div>
      <template #footer>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          @click="closeLogDetail(false)"
        >
          {{ t('settings-page.liaisons-logs-close') }}
        </Button>
      </template>
    </BaseModal>
  </div>
</template>
