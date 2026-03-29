<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Lucide from '@/base-components/Lucide/Lucide.vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const router = useRouter();

const recentLogs = ref([]);
const logsLoading = ref(true);

const dashboardCards = computed(() => []);

const quickActions = computed(() => [
  {
    title: t('menu.compliance'),
    icon: 'ShieldCheck',
    route: 'app-compliance-dashboard',
    color: 'bg-primary-muted',
  },
  {
    title: t('menu.risk'),
    icon: 'AlertTriangle',
    route: 'app-risk-dashboard',
    color: 'bg-primary-muted',
  },
]);

function fetchRecentLogs() {
  return;
}

// Helper function to get action icon
const getActionIcon = (action: string) => {
  const iconMap: Record<string, string> = {
    'create': 'Plus',
    'update': 'Edit',
    'delete': 'Trash2',
    'login': 'LogIn',
    'logout': 'LogOut',
    'view': 'Eye',
  };
  return iconMap[action?.toLowerCase()] || 'Activity';
};

// Helper function to get action color
const getActionColor = (action: string) => {
  const colorMap: Record<string, string> = {
    'create': 'text-success',
    'update': 'text-info',
    'delete': 'text-danger',
    'login': 'text-primary',
    'logout': 'text-slate-500',
    'view': 'text-warning',
  };
  return colorMap[action?.toLowerCase()] || 'text-slate-600';
};

// Helper function to format relative time
const getRelativeTime = (dateString: string) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'همین الان';
  if (minutes < 60) return `${minutes} دقیقه پیش`;
  if (hours < 24) return `${hours} ساعت پیش`;
  if (days < 7) return `${days} روز پیش`;
  
  return new Date(dateString).toLocaleDateString('fa-IR');
};

// Helper function to create chart path
const createChartPath = (data: number[], width: number, height: number, padding = 20) => {
  if (!data || data.length === 0) return '';
  
  const maxValue = Math.max(...data, 1);
  const minValue = Math.min(...data, 0);
  const range = maxValue - minValue || 1;
  
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  const stepX = chartWidth / (data.length - 1 || 1);
  
  let path = '';
  
  data.forEach((value, index) => {
    const x = padding + (index * stepX);
    const y = padding + chartHeight - ((value - minValue) / range * chartHeight);
    
    if (index === 0) {
      path += `M ${x} ${y}`;
    } else {
      path += ` L ${x} ${y}`;
    }
  });
  
  return path;
};

// Helper function to get max value for chart
const getChartMaxValue = (data: number[]) => {
  if (!data || data.length === 0) return 0;
  return Math.max(...data);
};

// Helper function to get total sum
const getChartSum = (data: number[]) => {
  if (!data || data.length === 0) return 0;
  return data.reduce((sum, val) => sum + val, 0);
};

// Navigate to route
const navigateTo = (routeName: string) => {
  router.push({ name: routeName });
};

// Initialize
onMounted(() => {
  fetchRecentLogs();
});
</script>

<template>
  <div class="grid grid-cols-12 gap-6">
    <!-- Page Header -->
    <div class="col-span-12">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">
            {{ t('menu.dashboard') }}
          </h2>
          <p class="text-slate-600 dark:text-slate-400 mt-1">
            خوش آمدید! آمار و اطلاعات کلی سیستم را مشاهده کنید.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <div class="text-xs text-slate-500 dark:text-slate-400">
            آخرین بروزرسانی: {{ new Date().toLocaleDateString('fa-IR') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div 
      v-for="(card, index) in dashboardCards" 
      :key="index"
      class="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-4"
    >
      <div
        @click="navigateTo(card.route)"
        class="relative overflow-hidden rounded-lg bg-white dark:bg-darkmode-600 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group border border-slate-200/60 dark:border-darkmode-400"
      >
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">
                {{ card.title }}
              </div>
              <div class="text-slate-500 dark:text-slate-500 text-xs mb-4">
                {{ card.description }}
              </div>
              
              <!-- Count Display -->
              <div v-if="card.count !== null" class="flex items-baseline gap-2">
                <div v-if="card.loading" class="flex items-center gap-2">
                  <div class="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
                <div v-else class="text-3xl font-bold text-slate-800 dark:text-slate-100">
                  {{ card.count.toLocaleString('fa-IR') }}
                </div>
                <div v-if="!card.loading" class="text-xs text-slate-500">
                  مورد
                </div>
              </div>
            </div>

            <!-- Icon -->
            <div 
              :class="[card.bgColor, 'p-3 rounded-xl group-hover:scale-110 transition-transform duration-300']"
            >
              <Lucide 
                :icon="card.icon" 
                :class="[card.iconColor, 'w-6 h-6']"
              />
            </div>
          </div>

          <!-- Action Button -->
          <div class="mt-4 pt-4 border-t border-slate-100 dark:border-darkmode-400">
            <div class="flex items-center text-sm text-primary group-hover:opacity-90 transition-colors">
              <span>مشاهده جزئیات</span>
              <Lucide icon="ChevronLeft" class="w-4 h-4 mr-1 group-hover:mr-2 transition-all" />
            </div>
          </div>
        </div>

        <!-- Gradient Overlay on Hover -->
        <div class="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/50 dark:to-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
    </div>

    <!-- Quick Actions Section -->
    <div class="col-span-12 mt-6">
      <div class="bg-white dark:bg-darkmode-600 rounded-lg shadow-sm border border-slate-200/60 dark:border-darkmode-400 p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">
              دسترسی سریع
            </h3>
            <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
              عملیات پرکاربرد را به سرعت انجام دهید
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          <div
            v-for="(action, index) in quickActions"
            :key="index"
            @click="navigateTo(action.route)"
            class="group cursor-pointer"
          >
            <div class="flex items-center gap-4 p-4 rounded-lg border-2 border-dashed border-slate-200 dark:border-darkmode-400 hover:border-primary hover:bg-primary/5 transition-all duration-300">
              <div :class="[action.color, 'p-3 rounded-lg text-white']">
                <Lucide :icon="action.icon" class="w-5 h-5" />
              </div>
              <div>
                <div class="font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                  {{ action.title }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity Section -->
<!--    <div class="col-span-12 lg:col-span-6 mt-6">-->
<!--      <div class="bg-white dark:bg-darkmode-600 rounded-lg shadow-sm border border-slate-200/60 dark:border-darkmode-400 p-6">-->
<!--        <div class="flex items-center justify-between mb-6">-->
<!--          <div>-->
<!--            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">-->
<!--              آخرین فعالیت‌ها-->
<!--            </h3>-->
<!--            <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">-->
<!--              تاریخچه اقدامات اخیر سیستم-->
<!--            </p>-->
<!--          </div>-->
<!--          <Lucide icon="Activity" class="w-5 h-5 text-slate-400" />-->
<!--        </div>-->

<!--        &lt;!&ndash; Loading State &ndash;&gt;-->
<!--        <div v-if="logsLoading" class="space-y-3">-->
<!--          <div v-for="i in 3" :key="i" class="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-darkmode-400 animate-pulse">-->
<!--            <div class="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>-->
<!--            <div class="flex-1 space-y-2">-->
<!--              <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>-->
<!--              <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>-->
<!--            </div>-->
<!--          </div>-->
<!--        </div>-->

<!--        &lt;!&ndash; Logs List &ndash;&gt;-->
<!--        <div v-else-if="recentLogs.length > 0" class="space-y-3">-->
<!--          <div-->
<!--            v-for="(log, index) in recentLogs"-->
<!--            :key="index"-->
<!--            class="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-darkmode-400 hover:bg-slate-100 dark:hover:bg-darkmode-500 transition-colors"-->
<!--          >-->
<!--            &lt;!&ndash; Icon &ndash;&gt;-->
<!--            <div class="flex-shrink-0 p-2 bg-white dark:bg-darkmode-600 rounded-lg">-->
<!--              <Lucide -->
<!--                :icon="getActionIcon(log.action || log.method)" -->
<!--                :class="[getActionColor(log.action || log.method), 'w-5 h-5']"-->
<!--              />-->
<!--            </div>-->

<!--            &lt;!&ndash; Content &ndash;&gt;-->
<!--            <div class="flex-1 min-w-0">-->
<!--              <div class="flex items-start justify-between gap-2">-->
<!--                <div class="flex-1">-->
<!--                  <p class="text-sm font-medium text-slate-700 dark:text-slate-300">-->
<!--                    {{ log.description || log.action || 'فعالیت سیستم' }}-->
<!--                  </p>-->
<!--                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">-->
<!--                    <span v-if="log.user">{{ log.user.email || log.user.username || 'کاربر' }}</span>-->
<!--                    <span v-else>سیستم</span>-->
<!--                    <span v-if="log.ip" class="mr-2">• IP: {{ log.ip }}</span>-->
<!--                  </p>-->
<!--                </div>-->
<!--                <span class="text-xs text-slate-500 whitespace-nowrap">-->
<!--                  {{ getRelativeTime(log.created_at || log.createdAt || log.timestamp) }}-->
<!--                </span>-->
<!--              </div>-->
<!--            </div>-->
<!--          </div>-->
<!--        </div>-->

<!--        &lt;!&ndash; Empty State &ndash;&gt;-->
<!--        <div v-else class="text-center py-8 text-slate-500 dark:text-slate-400">-->
<!--          <Lucide icon="Clock" class="w-12 h-12 mx-auto mb-3 opacity-50" />-->
<!--          <p class="text-sm">هیچ فعالیت اخیری ثبت نشده است</p>-->
<!--        </div>-->
<!--      </div>-->
<!--    </div>-->

<!--    &lt;!&ndash; System Status Section (Optional) &ndash;&gt;-->
<!--    <div class="col-span-12 lg:col-span-6 mt-6">-->
<!--      <div class="bg-white dark:bg-darkmode-600 rounded-lg shadow-sm border border-slate-200/60 dark:border-darkmode-400 p-6">-->
<!--        <div class="flex items-center justify-between mb-4">-->
<!--          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">-->
<!--            وضعیت سیستم-->
<!--          </h3>-->
<!--          <div class="flex items-center gap-2">-->
<!--            <div class="w-2 h-2 bg-success rounded-full animate-pulse"></div>-->
<!--            <span class="text-sm text-success">آنلاین</span>-->
<!--          </div>-->
<!--        </div>-->
<!--        <div class="space-y-4">-->
<!--          <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-darkmode-400">-->
<!--            <div class="flex items-center gap-3">-->
<!--              <div class="p-2 bg-success/10 rounded-lg">-->
<!--                <Lucide icon="Database" class="w-4 h-4 text-success" />-->
<!--              </div>-->
<!--              <span class="text-sm font-medium text-slate-700 dark:text-slate-300">پایگاه داده</span>-->
<!--            </div>-->
<!--            <span class="text-xs text-success font-medium">فعال</span>-->
<!--          </div>-->
<!--          <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-darkmode-400">-->
<!--            <div class="flex items-center gap-3">-->
<!--              <div class="p-2 bg-success/10 rounded-lg">-->
<!--                <Lucide icon="Server" class="w-4 h-4 text-success" />-->
<!--              </div>-->
<!--              <span class="text-sm font-medium text-slate-700 dark:text-slate-300">سرور API</span>-->
<!--            </div>-->
<!--            <span class="text-xs text-success font-medium">فعال</span>-->
<!--          </div>-->
<!--          <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-darkmode-400">-->
<!--            <div class="flex items-center gap-3">-->
<!--              <div class="p-2 bg-success/10 rounded-lg">-->
<!--                <Lucide icon="HardDrive" class="w-4 h-4 text-success" />-->
<!--              </div>-->
<!--              <span class="text-sm font-medium text-slate-700 dark:text-slate-300">فضای ذخیره‌سازی</span>-->
<!--            </div>-->
<!--            <span class="text-xs text-slate-500 font-medium">%۷۵</span>-->
<!--          </div>-->
<!--        </div>-->
<!--      </div>-->
<!--    </div>-->
  </div>
</template>
