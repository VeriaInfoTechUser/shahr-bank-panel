<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Lucide from '@/base-components/Lucide/Lucide.vue';
import { userRepo } from '@/core/repositories/userRepo';

const { t } = useI18n();
const router = useRouter();

/** پاسخ POST user/profile/view */
interface ProfilePayload {
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  identity?: string;
  mobile?: string;
  last_login_view?: string;
}

const profile = ref<ProfilePayload | null>(null);
const profileLoading = ref(true);
const profileError = ref(false);

const displayName = computed(() => {
  const p = profile.value;
  if (!p) return '';
  if (p.name?.trim()) return p.name.trim();
  const fn = p.first_name?.trim() ?? '';
  const ln = p.last_name?.trim() ?? '';
  const joined = [fn, ln].filter(Boolean).join('\u00A0');
  return joined || '—';
});

onMounted(async () => {
  profileError.value = false;
  try {
    const res = await userRepo.getProfile();
    if (res?.result && res?.data && typeof res.data === 'object') {
      profile.value = res.data as ProfilePayload;
    } else {
      profileError.value = true;
    }
  } catch {
    profileError.value = true;
  } finally {
    profileLoading.value = false;
  }
});

type PrimaryRoute =
  | 'app-compliance-operations'
  | 'app-risk-operations'
  | 'app-base-info-rules-regulations'
  | 'app-base-info-tasks'
  | 'app-base-info-framework'
  | 'app-base-info-domain'
  | 'app-compliance-task'
  | 'app-risk-list'
  | 'app-esg-dashboard'
  | 'app-esg-governance'
  | 'app-esg-social'
  | 'app-esg-environment'
  | 'app-esg-report';

interface Spot {
  route: PrimaryRoute;
  titleKey: string;
  descKey: string;
  icon: string;
}

const spots = computed<Spot[]>(() => [
  {
    route: 'app-base-info-framework',
    titleKey: 'menu.framework',
    descKey: 'dashboard-page.spot-framework-desc',
    icon: 'Layers',
  },
  {
    route: 'app-base-info-domain',
    titleKey: 'menu.domain',
    descKey: 'dashboard-page.spot-domain-desc',
    icon: 'Globe',
  },
  {
    route: 'app-compliance-task',
    titleKey: 'menu.compliance-task',
    descKey: 'dashboard-page.spot-compliance-task-desc',
    icon: 'ClipboardCheck',
  },
  {
    route: 'app-risk-list',
    titleKey: 'menu.risk-operations',
    descKey: 'dashboard-page.spot-risk-list-desc',
    icon: 'AlertTriangle',
  },
  // {
  //   route: 'app-esg-dashboard',
  //   titleKey: 'menu.esg-dashboard',
  //   descKey: 'dashboard-page.spot-esg-dashboard-desc',
  //   icon: 'BarChart3',
  // },
  {
    route: 'app-esg-governance',
    titleKey: 'menu.esg-governance',
    descKey: 'dashboard-page.spot-esg-governance-desc',
    icon: 'Building2',
  },
  {
    route: 'app-esg-social',
    titleKey: 'menu.esg-social',
    descKey: 'dashboard-page.spot-esg-social-desc',
    icon: 'Users',
  },
  {
    route: 'app-esg-environment',
    titleKey: 'menu.esg-environment',
    descKey: 'dashboard-page.spot-esg-environment-desc',
    icon: 'Leaf',
  },
  {
    route: 'app-esg-report',
    titleKey: 'menu.esg-report',
    descKey: 'dashboard-page.spot-esg-report-desc',
    icon: 'FileText',
  },
]);

function go(name: PrimaryRoute) {
  router.push({ name });
}
</script>

<template>
  <div
    class="mx-auto max-w-5xl px-1 pb-12 pt-2 md:px-2"
  >
    <header
      class="mb-10 md:mb-14"
    >
      <div
        class="flex flex-col gap-6 border-b border-slate-200/80 pb-8 dark:border-darkmode-600 lg:flex-row lg:items-start lg:justify-between lg:gap-8"
      >
        <div class="min-w-0 flex-1 space-y-5">
          <div
            class="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5"
          >
            <div class="flex shrink-0 items-center gap-3">
              <div
                class="relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-sm ring-1 ring-primary/20 dark:from-primary/25 dark:via-primary/15 dark:ring-primary/30"
                aria-hidden="true"
              >
                <Lucide
                  icon="ShieldCheck"
                  class="h-9 w-9 text-primary"
                />
              </div>
              <div
                class="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/90 px-2.5 py-2 dark:border-darkmode-600 dark:bg-darkmode-800/80"
              >
                <span
                  class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm dark:bg-darkmode-700 dark:text-slate-300"
                  :title="t('menu.rules-regulations')"
                >
                  <Lucide
                    icon="Scale"
                    class="h-4 w-4"
                  />
                </span>
                <span
                  class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primary shadow-sm dark:bg-darkmode-700"
                  :title="t('menu.compliance-operations')"
                >
                  <Lucide
                    icon="ClipboardCheck"
                    class="h-4 w-4"
                  />
                </span>
                <span
                  class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm dark:bg-darkmode-700 dark:text-amber-400"
                  :title="t('menu.risk-operations')"
                >
                  <Lucide
                    icon="AlertTriangle"
                    class="h-4 w-4"
                  />
                </span>
              </div>
            </div>
            <div
              class="min-w-0 flex-1 space-y-1 border-t border-slate-200/80 pt-4 dark:border-darkmode-600 sm:border-s sm:border-t-0 sm:ps-5 sm:pt-0"
            >
              <p
                class="text-sm font-semibold text-primary"
              >
                {{ t('dashboard-page.identity-label') }}
              </p>
              <p
                class="text-base font-semibold leading-snug text-slate-900 dark:text-slate-50"
              >
                {{ t('dashboard-page.identity-title') }}
              </p>
            </div>
          </div>
          <p
            class="max-w-3xl text-base font-medium leading-relaxed text-slate-700 dark:text-slate-300 md:text-[1.05rem]"
          >
            {{ t('dashboard-page.subtitle') }}
          </p>
        </div>

        <div
          class="w-full shrink-0 lg:max-w-sm"
        >
          <div
            v-if="profileLoading"
            class="animate-pulse rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 dark:border-darkmode-600 dark:bg-darkmode-800/80"
          >
            <div class="mb-3 h-4 w-2/3 rounded bg-slate-200 dark:bg-darkmode-600" />
            <div class="mb-2 h-3 w-full rounded bg-slate-100 dark:bg-darkmode-700" />
            <div class="h-3 w-4/5 rounded bg-slate-100 dark:bg-darkmode-700" />
          </div>
          <div
            v-else-if="profileError"
            class="rounded-2xl border border-danger/25 bg-danger/5 p-4 text-sm text-danger dark:border-danger/40 dark:bg-danger/10"
          >
            {{ t('dashboard-page.profile-load-error') }}
          </div>
          <div
            v-else-if="profile"
            class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800"
          >
            <p
              class="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500"
            >
              {{ t('dashboard-page.profile-card-title') }}
            </p>
            <p
              class="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50"
            >
              {{ displayName }}
            </p>
            <dl class="space-y-2.5 text-sm">
              <div
                v-if="profile.email"
                class="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2"
              >
                <dt class="shrink-0 text-slate-400 dark:text-slate-500">
                  {{ t('dashboard-page.profile-email') }}
                </dt>
                <dd
                  class="min-w-0 break-all text-slate-700 dark:text-slate-200"
                  dir="ltr"
                >
                  {{ profile.email }}
                </dd>
              </div>
              <div
                v-if="profile.identity"
                class="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2"
              >
                <dt class="shrink-0 text-slate-400 dark:text-slate-500">
                  {{ t('dashboard-page.profile-identity') }}
                </dt>
                <dd class="text-slate-700 dark:text-slate-200">
                  {{ profile.identity }}
                </dd>
              </div>
              <div
                v-if="profile.mobile"
                class="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2"
              >
                <dt class="shrink-0 text-slate-400 dark:text-slate-500">
                  {{ t('title.mobile') }}
                </dt>
                <dd
                  class="min-w-0 text-slate-700 dark:text-slate-200"
                  dir="ltr"
                >
                  {{ profile.mobile }}
                </dd>
              </div>
              <div
                v-if="profile.last_login_view"
                class="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2"
              >
                <dt class="shrink-0 text-slate-400 dark:text-slate-500">
                  {{ t('dashboard-page.profile-last-login') }}
                </dt>
                <dd class="text-slate-700 dark:text-slate-200">
                  {{ profile.last_login_view }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </header>

    <div class="grid gap-5 md:grid-cols-4 lg:gap-6">
      <button
        v-for="spot in spots"
        :key="spot.route"
        type="button"
        class="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-start shadow-sm ring-0 transition hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-darkmode-600 dark:bg-darkmode-800 dark:hover:border-darkmode-500"
        @click="go(spot.route)"
      >
        <div
          class="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50/0 to-slate-50/80 opacity-0 transition group-hover:opacity-100 dark:from-transparent dark:to-darkmode-900/40"
        />
        <div class="relative flex flex-1 flex-col p-4">
          <div class="flex flex-row gap-2">
          <div
            class="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-primary/10 group-hover:text-primary dark:bg-darkmode-700 dark:text-slate-200 dark:group-hover:bg-primary/15 dark:group-hover:text-primary"
          >
            <Lucide :icon="spot.icon" class="h-5 w-5" />
          </div>
          <h2
            class="mt-2 text-base font-semibold text-slate-900 dark:text-slate-50"
          >
            {{ t(spot.titleKey) }}
          </h2>
          </div>
          <p
            class="mb-4 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400"
          >
            {{ t(spot.descKey) }}
          </p>
          <div class="flex justify-end">
            <span
              class="inline-flex items-center gap-1.5 text-xs font-medium text-primary opacity-90 transition group-hover:opacity-100"
            >
              {{ t('dashboard-page.cta') }}
              <Lucide
                icon="ArrowRight"
                class="h-3.5 w-3.5 transition group-hover:translate-x-0.5 rtl:rotate-180 rtl:-translate-x-0.5 rtl:group-hover:-translate-x-1"
              />
            </span>
          </div>
        </div>
      </button>
    </div>

    <p
      class="mt-10 text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500"
    >
      {{ t('dashboard-page.footer-hint') }}
    </p>
  </div>
</template>
