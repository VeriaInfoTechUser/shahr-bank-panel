<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import Lucide from "../../base-components/Lucide";
import {Menu} from "../../base-components/Headless";
import {useLogout} from "@/composables/useLogout.js";
import {useUserStore} from "@/stores/user";
import {localeOptions} from "@/constants/config.js";
import {getDirection} from "@/utils/index.js";
import {useLocaleStore} from "@/stores/locale.js";
import router from "@/router/index";


const userStore = useUserStore();
const {locale} = useI18n();

const localeStore = useLocaleStore()
function changeLanguage(data) {
  const {id: locale, direction} = data
  const currentDirection = getDirection().direction;
  if (direction !== currentDirection) {
    localeStore.changeDirection(direction)
  }
  localeStore.changeLang(locale)
}

const displayName = computed(() => {
  const u = userStore.currentUser
  if (!u) return ""
  return [u.first_name ?? u.firstName, u.last_name ?? u.lastName].filter(Boolean).join(" ") || u.name || u.email || ""
})

const initials = computed(() => {
  const name = displayName.value.trim()
  if (!name) return "؟"
  const parts = name.split(/\s+/)
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "؟"
})

</script>

<template>
  <section>
    <!-- BEGIN: Top Bar -->
    <header
        class="top-bar h-header z-[60] relative bg-surface/90 backdrop-blur-md border-b border-border/80 px-4 md:px-6"
    >
      <div class="flex items-center h-full gap-3 md:gap-4">
        <!-- BEGIN: Logo + brand badge -->
        <RouterLink
            :to="{ name: 'app-dashboard' }"
            class="flex items-center gap-2.5 shrink-0"
        >
          <span
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-active text-primary-foreground shadow-md shadow-primary/25"
          >
            <Lucide icon="Landmark" class="h-5 w-5"/>
          </span>
          <span class="hidden md:flex flex-col leading-none min-w-0">
            <span
                class="max-w-[340px] truncate text-sm font-extrabold text-text-primary lg:text-base"
                :title="$t('title.web-title-short')"
            >{{ $t("title.web-title-short") }}</span>
          </span>
        </RouterLink>
        <!-- END: Logo + brand badge -->

        <div class="ms-auto flex items-center gap-1 md:gap-2">
          <!-- BEGIN: Language Menu -->
          <Menu>
            <Menu.Button
                class="relative outline-none block"
            >
              <span
                  class="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-bold text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
              >
                {{ $i18n.locale.toUpperCase() }}
                <Lucide icon="ChevronDown" class="h-3.5 w-3.5"/>
              </span>
            </Menu.Button>
            <Menu.Items
                class="w-32 mt-1 relative bg-surface border border-border/80 shadow-xl rounded-xl text-text-secondary"
            >
              <Menu.Item
                  class="hover:bg-primary/5 hover:text-primary"
                  v-for="lang in localeOptions"
                  :key="lang.id"
                  @click="changeLanguage(lang)"
              >
                <Lucide icon="Languages" class="w-4 h-4 me-2"/>
                {{ lang.name }}
              </Menu.Item>
            </Menu.Items>
          </Menu>
          <!-- END: Language Menu -->

          <!-- BEGIN: Account Menu -->
          <Menu>
            <Menu.Button class="relative outline-none block">
              <span
                  class="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface ps-1.5 pe-2.5 transition-colors hover:border-primary/40"
              >
                <span
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground"
                >{{ initials }}</span>
                <span class="hidden md:flex flex-col text-start leading-tight">
                  <span class="text-sm font-bold text-text-primary">{{ displayName || $t('panel.manager-role') }}</span>
                  <span class="text-[10px] text-text-muted">{{ $t('panel.manager-role') }}</span>
                </span>
                <Lucide icon="ChevronDown" class="h-3.5 w-3.5 text-text-muted"/>
              </span>
            </Menu.Button>
            <Menu.Items
                class="w-56 mt-1 relative bg-surface border border-border/80 shadow-xl rounded-xl text-text-secondary"
            >
              <Menu.Header class="font-normal">
                <div class="font-medium text-text-primary">
                  {{ displayName }}
                </div>
                <div class="text-xs text-text-muted mt-0.5">
                  {{ userStore.currentUser ? userStore.currentUser.email : "" }}
                </div>
              </Menu.Header>
              <Menu.Divider class="bg-border/70"/>
              <Menu.Item class="hover:bg-primary/5 hover:text-primary" @click="router.push({name:'app-account-profile'})">
                <Lucide icon="User" class="w-4 h-4 me-2"/>
                {{ $t('menu.profile') }}
              </Menu.Item>
              <Menu.Divider class="bg-border/70"/>
              <Menu.Item class="hover:bg-danger/10 hover:text-danger" @click="useLogout">
                <Lucide icon="ToggleRight" class="w-4 h-4 me-2"/>
                {{ $t('menu.logout') }}
              </Menu.Item>
            </Menu.Items>
          </Menu>
          <!-- END: Account Menu -->
        </div>
      </div>
    </header>
    <!-- END: Top Bar -->
  </section>
</template>
