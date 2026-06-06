<script setup>
import {computed, onMounted, onUnmounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import Lucide from "../../base-components/Lucide";
import logoUrl from "@/assets/demo/logo.png";
import Breadcrumb from "../../base-components/Breadcrumb";
import {Menu} from "../../base-components/Headless";
import {useLogout} from "@/composables/useLogout.js";
import {useUserStore} from "@/stores/user";
import {useRoute} from "vue-router";
import {useFetch} from "@/composables/useFetch.js";
import {localeOptions, setting, uri} from "@/constants/config.js";
import {useNumberFormat} from "@/composables/useNumberFormat.js";
import { getDirection} from "@/utils/index.js";
import {useLocaleStore} from "@/stores/locale.js";
import BaseButton from "@/base-components/Button";
import router from "@/router/index";


const userStore = useUserStore();
const {formatNumber} = useNumberFormat();
const {locale} = useI18n();

const now = ref(new Date());
let clockIntervalId = null;

const headerDateTime = computed(() => {
  const loc = locale.value;
  const tag = loc === "fa" ? "fa-IR" : loc === "ar" ? "ar" : "en-US";
  const d = now.value;
  const dateStr = d.toLocaleDateString(tag, {dateStyle: "long"});
  const timeStr = d.toLocaleTimeString(tag, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return {dateStr, timeStr, iso: d.toISOString()};
});

const route = useRoute()
const id = ref(route.params.id)
const loadingFlag = ref(false)
const wallet = ref({})

async function getWallet() {
  loadingFlag.value = true
  try {
    // Await the result of useFetch
    const {data, error} = await useFetch(uri.api?.wallet?.view, {method: "GET"});
    if (error) {
    } else {
      wallet.value = data
    }
  } catch (err) {
    console.log(err)
  } finally {
    loadingFlag.value = false;
  }
}


const localeStore = useLocaleStore()
function changeLanguage(data) {
  const {id: locale, direction} = data
  const currentDirection = getDirection().direction;
  if (direction !== currentDirection) {
    localeStore.changeDirection(direction)
  }
  localeStore.changeLang(locale)
}

onMounted(() => {
  clockIntervalId = setInterval(() => {
    now.value = new Date();
  }, 1000);
  if (setting.wallet.isActive) {
    getWallet();
  }
});

onUnmounted(() => {
  if (clockIntervalId) {
    clearInterval(clockIntervalId);
  }
});

</script>

<template>
  <section>
    <!-- BEGIN: Top Bar -->
    <div
        class="top-bar-boxed h-[64px] z-[51] relative bg-slate-900 border border-white/10 my-1 px-4 md:px-6 rounded-xl shadow-md"
    >
      <div class="flex items-center h-full">
        <!-- BEGIN: Logo -->
        <RouterLink
            :to="{ name: 'app-dashboard' }"
            class="hidden -intro-x md:flex"
        >
          <img
              :alt="$t('title.logo-alt')"
              class="w-6"
              :src="logoUrl"
          />
          <span class="ms-3 text-lg text-white"> {{ $t("title.web-title") }} </span>
        </RouterLink>
        <!-- END: Logo -->
        <!-- BEGIN: Breadcrumb -->
        <Breadcrumb
            light
            class="h-full md:ms-10 md:ps-10 md:border-l border-white/[0.08] me-auto -intro-x"
        >
          <Breadcrumb.Link to="/"></Breadcrumb.Link>
          <Breadcrumb.Link to="/" :active="true"></Breadcrumb.Link>
        </Breadcrumb>
        <!-- END: Breadcrumb -->

        <!-- BEGIN: Live date/time (کنار منوی کاربر) -->
        <div
            class="me-2 flex flex-col items-end justify-center tabular-nums text-white/85 sm:me-3 rtl:items-start"
        >
          <time
              class="max-w-[11rem] truncate text-end text-[10px] leading-tight opacity-90 sm:max-w-none sm:text-xs"
              :datetime="headerDateTime.iso"
          >
            {{ headerDateTime.dateStr }}
          </time>
          <time
              class="text-end text-[11px] font-semibold leading-tight text-white sm:text-sm"
              :datetime="headerDateTime.iso"
          >
            {{ headerDateTime.timeStr }}
          </time>
        </div>
        <!-- END: Live date/time -->
        <!-- BEGIN: Account Menu -->
        <Menu>
          <Menu.Button
              class="relative text-white/70 outline-none block"
          >
            <Lucide icon="User" class="w-8 h-8 dark:text-slate-500"/>
          </Menu.Button>
          <Menu.Items
              class="w-56 mt-px relative bg-slate-900/95 before:block before:absolute before:bg-black before:inset-0 before:rounded-md before:z-[-1] text-white"
          >
            <Menu.Header class="font-normal">
              <div class="font-medium">
                {{ userStore.currentUser ? userStore.currentUser.firstName : "" }}
              </div>
              <div class="text-xs text-white/70 mt-0.5 dark:text-slate-500">
                {{ userStore.currentUser ? userStore.currentUser.email : "" }}
              </div>
            </Menu.Header>
            <Menu.Divider class="bg-white/[0.08]"/>
            <Menu.Item class="hover:bg-white/5" @click="router.push({name:'app-account-profile'})">
              <Lucide icon="User" class="w-4 h-4 me-2"/>
              {{ $t('menu.profile') }}
            </Menu.Item>
            <Menu.Divider class="bg-white/[0.08]"/>
            <Menu.Item class="hover:bg-white/5" @click="useLogout">
              <Lucide icon="ToggleRight" class="w-4 h-4 me-2"/>
              {{ $t('menu.logout') }}
            </Menu.Item>
          </Menu.Items>
        </Menu>
        <!-- END: Account Menu -->
        <!-- BEGIN: Language Menu -->
        <Menu>
          <Menu.Button
              class="relative text-white/70 outline-none block"
          >
            <BaseButton variant="outline-secondary"  size="sm" class="mx-3 text-white font-bold text-base">
            {{ $i18n.locale.toUpperCase() }}
            </BaseButton>
          </Menu.Button>
          <Menu.Items
              class="w-24 mt-px relative bg-slate-900/95 before:block before:absolute before:bg-black before:inset-0 before:rounded-md before:z-[-1] text-white"
          >
            <Menu.Item class="hover:bg-white/5" v-for="lang in localeOptions" :key="lang.id" @click="changeLanguage(lang)">
              <Lucide icon="Languages" class="w-4 h-4 me-2"/>
              {{ lang.name }}
            </Menu.Item>
          </Menu.Items>
        </Menu>
        <!-- END: Language Menu -->
      </div>
    </div>
    <!-- END: Top Bar -->
  </section>
</template>
