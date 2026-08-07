<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Lucide from '@/base-components/Lucide/Lucide.vue';
import { userRepo } from '@/core/repositories/userRepo';
import logoUrl from '@/assets/grc-logo.png';

const { t, locale } = useI18n();
const router = useRouter();

/** پاسخ POST user/profile/view */
interface ProfilePayload {
  name?: string;
  first_name?: string;
  last_name?: string;
}

const profile = ref<ProfilePayload | null>(null);
const profileLoading = ref(true);

const displayName = computed(() => {
  const p = profile.value;
  if (!p) return '';
  if (p.name?.trim()) return p.name.trim();
  const fn = p.first_name?.trim() ?? '';
  const ln = p.last_name?.trim() ?? '';
  const joined = [fn, ln].filter(Boolean).join('\u00A0');
  return joined;
});

const greeting = computed(() =>
  displayName.value
    ? t('dashboard-page.greeting', { name: displayName.value })
    : t('dashboard-page.greeting-anon'),
);

const todayLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date()),
);

const dateLine = computed(() =>
  todayLabel.value ? `${t('dashboard-page.date-prefix')}، ${todayLabel.value}` : '',
);

onMounted(async () => {
  try {
    const res = await userRepo.getProfile();
    if (res?.result && res?.data && typeof res.data === 'object') {
      profile.value = res.data as ProfilePayload;
    }
  } finally {
    profileLoading.value = false;
  }
});

type ModuleRoute =
  | 'app-compliance-dashboard'
  | 'app-risk-dashboard'
  | 'app-sustainability-graph'
  | 'app-reports-sustainability-dashboard'
  | 'app-data-raw'
  | 'app-knowledge-prompts';

interface Module {
  route: ModuleRoute;
  titleKey: string;
  descKey: string;
  icon: string;
  /** گرادیان آیکون */
  tile: string;
  /** هاله‌ی گوشه‌ی کارت */
  glow: string;
  /** رنگ حاشیه/سایه در هاور */
  ring: string;
}

const modules: Module[] = [
  {
    route: 'app-compliance-dashboard',
    titleKey: 'menu.compliance',
    descKey: 'dashboard-page.module-compliance-desc',
    icon: 'ShieldCheck',
    tile: 'from-primary to-sky-500',
    glow: 'bg-primary/10 group-hover:bg-primary/20 dark:bg-primary/15 dark:group-hover:bg-primary/25',
    ring: 'group-hover:border-primary/40 group-hover:shadow-primary/10',
  },
  {
    route: 'app-risk-dashboard',
    titleKey: 'menu.risk',
    descKey: 'dashboard-page.module-risk-desc',
    icon: 'AlertTriangle',
    tile: 'from-amber-500 to-orange-500',
    glow: 'bg-amber-500/10 group-hover:bg-amber-500/20 dark:bg-amber-500/15 dark:group-hover:bg-amber-500/25',
    ring: 'group-hover:border-amber-500/40 group-hover:shadow-amber-500/10',
  },
  {
    route: 'app-sustainability-graph',
    titleKey: 'menu.sustainability',
    descKey: 'dashboard-page.module-sustainability-desc',
    icon: 'Leaf',
    tile: 'from-emerald-500 to-teal-500',
    glow: 'bg-emerald-500/10 group-hover:bg-emerald-500/20 dark:bg-emerald-500/15 dark:group-hover:bg-emerald-500/25',
    ring: 'group-hover:border-emerald-500/40 group-hover:shadow-emerald-500/10',
  },
  {
    route: 'app-reports-sustainability-dashboard',
    titleKey: 'menu.reports',
    descKey: 'dashboard-page.module-reports-desc',
    icon: 'FileBarChart',
    tile: 'from-violet-500 to-purple-500',
    glow: 'bg-violet-500/10 group-hover:bg-violet-500/20 dark:bg-violet-500/15 dark:group-hover:bg-violet-500/25',
    ring: 'group-hover:border-violet-500/40 group-hover:shadow-violet-500/10',
  },
  {
    route: 'app-data-raw',
    titleKey: 'menu.data',
    descKey: 'dashboard-page.module-data-desc',
    icon: 'Database',
    tile: 'from-sky-500 to-blue-500',
    glow: 'bg-sky-500/10 group-hover:bg-sky-500/20 dark:bg-sky-500/15 dark:group-hover:bg-sky-500/25',
    ring: 'group-hover:border-sky-500/40 group-hover:shadow-sky-500/10',
  },
  {
    route: 'app-knowledge-prompts',
    titleKey: 'menu.knowledge',
    descKey: 'dashboard-page.module-knowledge-desc',
    icon: 'BookOpen',
    tile: 'from-rose-500 to-pink-500',
    glow: 'bg-rose-500/10 group-hover:bg-rose-500/20 dark:bg-rose-500/15 dark:group-hover:bg-rose-500/25',
    ring: 'group-hover:border-rose-500/40 group-hover:shadow-rose-500/10',
  },
];

function go(name: ModuleRoute) {
  router.push({ name });
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-1 pb-12 pt-4 md:px-2 md:pt-6">
    <!-- هدر خوش‌آمد -->
    <header class="flex flex-col gap-6 border-b border-slate-200/80 pb-8 dark:border-darkmode-600 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:pb-10">
      <div class="flex min-w-0 items-center gap-4">
        <div
          class="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-lg shadow-primary/10 ring-1 ring-slate-200/90 dark:bg-darkmode-800 dark:ring-darkmode-600"
        >
          <img
            :src="logoUrl"
            :alt="t('title.logo-alt')"
            class="h-full w-full object-contain"
          />
        </div>
        <div class="min-w-0">
          <h1 class="text-base font-bold leading-snug text-slate-900 dark:text-slate-50 sm:text-lg">
            {{ t('dashboard-page.identity-title') }}
          </h1>
          <p class="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {{ t('dashboard-page.subtitle') }}
          </p>
        </div>
      </div>

      <div class="flex shrink-0 flex-col gap-1.5 sm:items-end sm:text-end">
        <template v-if="profileLoading">
          <div class="h-5 w-44 animate-pulse rounded-md bg-slate-200 dark:bg-darkmode-600" />
          <div class="h-3.5 w-40 animate-pulse rounded-md bg-slate-100 dark:bg-darkmode-700" />
        </template>
        <template v-else>
          <p class="text-lg font-bold text-slate-900 dark:text-slate-50">
            {{ greeting }}
          </p>
          <p v-if="dateLine" class="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 sm:justify-end">
            <Lucide icon="CalendarDays" class="h-4 w-4 text-primary" />
            <span>{{ dateLine }}</span>
          </p>
        </template>
      </div>
    </header>

    <!-- دسترسی سریع: یک کارت برای هر ماژول اصلی -->
    <main class="pt-8">
      <section>
        <div class="mb-5 flex items-center gap-3">
          <div
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 dark:bg-primary/15 dark:ring-primary/25"
          >
            <Lucide icon="Compass" class="h-4 w-4" />
          </div>
          <h2 class="text-base font-bold text-slate-900 dark:text-slate-50">
            {{ t('dashboard-page.quick-access') }}
          </h2>
          <div class="h-px flex-1 bg-slate-200/80 dark:bg-darkmode-600" aria-hidden="true" />
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="m in modules"
            :key="m.route"
            type="button"
            class="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 text-start shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-darkmode-600 dark:bg-darkmode-800"
            :class="m.ring"
            @click="go(m.route)"
          >
            <!-- هاله‌ی رنگی گوشه -->
            <div
              aria-hidden="true"
              class="pointer-events-none absolute -end-8 -top-8 h-28 w-28 rounded-full opacity-60 blur-2xl transition-opacity duration-300"
              :class="m.glow"
            />

            <!-- ردیف بالا: آیکون + برچسب باز کردن -->
            <div class="relative flex items-start justify-between gap-3">
              <div
                class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-105"
                :class="m.tile"
              >
                <Lucide :icon="m.icon" class="h-6 w-6" />
              </div>
              <span
                class="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/90 px-3 py-1.5 text-xs font-semibold text-slate-500 opacity-0 transition-all duration-300 group-hover:opacity-100 dark:border-darkmode-600 dark:bg-darkmode-700 dark:text-slate-300"
              >
                {{ t('dashboard-page.cta') }}
                <Lucide
                  icon="ArrowRight"
                  class="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                />
              </span>
            </div>

            <!-- متن کارت -->
            <div class="relative mt-5">
              <h3 class="text-base font-bold leading-snug text-slate-900 dark:text-slate-50">
                {{ t(m.titleKey) }}
              </h3>
              <p class="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {{ t(m.descKey) }}
              </p>
            </div>
          </button>
        </div>
      </section>

      <p class="mt-12 text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        {{ t('dashboard-page.footer-hint') }}
      </p>
    </main>
  </div>
</template>
