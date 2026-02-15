<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import Tippy from "../../base-components/Tippy";
import Lucide from "../../base-components/Lucide";
import TopBar from "../../components/TopBar";
import Breadcrumb from "../../components/Breadcrumb/Breadcrumb.vue";
import DarkModeSwitcher from "../../components/DarkModeSwitcher";
import MainColorSwitcher from "../../components/MainColorSwitcher";
import MobileMenu from "../../components/MobileMenu";
import { useSideMenuStore } from "../../stores/side-menu";
import {
  ProvideForceActiveMenu,
  forceActiveMenu,
  Route,
  FormattedMenu,
  nestedMenu,
  linkTo,
  enter,
  leave,
} from "./side-menu";
import { watch, reactive, ref, computed, onMounted, provide } from "vue";

const route: Route = useRoute();
const router = useRouter();
let formattedMenu = reactive<Array<FormattedMenu | "divider">>([]);
const setFormattedMenu = (
  computedFormattedMenu: Array<FormattedMenu | "divider">
) => {
  Object.assign(formattedMenu, computedFormattedMenu);
};
const sideMenuStore = useSideMenuStore();
const sideMenu = computed(() => nestedMenu(sideMenuStore.menu, route));
const windowWidth = ref(window.innerWidth);

provide<ProvideForceActiveMenu>("forceActiveMenu", (pageName: string) => {
  forceActiveMenu(route, pageName);
  setFormattedMenu(sideMenu.value);
});

watch(sideMenu, () => {
  setFormattedMenu(sideMenu.value);
});

watch(
  computed(() => route.path),
  () => {
    delete route.forceActiveMenu;
  }
);

onMounted(() => {
  setFormattedMenu(sideMenu.value);

  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
});
</script>

<template>
  <div
    class="pb-8 min-h-screen before:content-[''] before:absolute before:inset-0 before:bg-fixed before:bg-no-repeat before:bg-skew-pattern dark:before:bg-skew-pattern-dark"
  >
<!--    <DarkModeSwitcher />-->
<!--    <MainColorSwitcher />-->
    <MobileMenu />
    <TopBar />
    <div
        :class="[
          'relative',
          'before:content-[\'\'] before:w-[95%] before:z-[-1] before:rounded-xl before:bg-white/5 before:h-full before:-mt-4 before:absolute before:mx-auto before:inset-x-0 before:dark:bg-darkmode-600/30',

          // Animation
          'before:translate-y-[35px] before:opacity-0 before:animate-[0.4s_ease-in-out_0.1s_intro-wrapper] before:animate-fill-mode-forwards',
        ]"
    >
      <div
        :class="[
          'translate-y-0 bg-slate-900 flex rounded-xl -mt-[4px] md:mt-0 dark:bg-darkmode-800 shadow-xl',
          'before:block before:absolute before:inset-0 before:bg-black/[0.12] before:rounded-xl before:z-[-1]',

          // Animation
          'animate-[0.4s_ease-in-out_0.2s_intro-wrapper] animate-fill-mode-forwards translate-y-[35px]',
        ]"
      >
        <!-- BEGIN: Side Menu -->
        <nav
          class="side-nav hidden md:block w-[105px] xl:w-[200px] ps-2 pe-5 pt-8 pb-16 overflow-x-hidden"
        >
          <ul>
            <!-- BEGIN: First Child -->
            <template v-for="(menu, menuKey) in formattedMenu">
              <li
                v-if="menu == 'divider'"
                type="li"
                :class="[
                  'side-nav__divider my-6',
                  // Animation
                  `opacity-0 animate-[0.4s_ease-in-out_0.1s_intro-divider] animate-fill-mode-forwards animate-delay-${
                    (menuKey + 1) * 10
                  }`,
                ]"
                :key="'divider-' + menuKey"
              ></li>
              <li v-else :key="menuKey">
                <Tippy
                  as="a"
                  :content=" $t(menu.title) "
                  :options="{
                    placement: 'right',
                  }"
                  :disable="windowWidth > 1260"
                  :href="
                  menu.subMenu
                    ? '#'
                    : ((pageName: string | undefined) => {
                        try {
                          return router.resolve({
                            name: pageName,
                          }).fullPath;
                        } catch (err) {
                          return '';
                        }
                      })(menu.pageName)
                "
                  @click="(event: MouseEvent) => {
                  event.preventDefault();
                  linkTo(menu, router);
                  setFormattedMenu([...formattedMenu]);
                }"
                  :class="[
                    menu.active ? 'side-menu side-menu--active' : 'side-menu',

                    // Animation
                    {
                      [`opacity-0 translate-x-[50px] animate-[0.4s_ease-in-out_0.1s_intro-menu] animate-fill-mode-forwards animate-delay-${
                        (menuKey + 1) * 10
                      }`]: !menu.active,
                    },
                  ]"
                >
                  <div class="side-menu__icon">
                    <Lucide :icon="menu.icon" />
                  </div>
                  <div class="side-menu__title">
                    {{ $t(menu.title) }}
                    <div
                      v-if="menu.subMenu"
                      :class="[
                        'side-menu__sub-icon',
                        { 'transform rotate-180': menu.activeDropdown },
                      ]"
                    >
                      <Lucide icon="ChevronDown" />
                    </div>
                  </div>
                </Tippy>
                <Transition @enter="enter" @leave="leave">
                  <ul
                    v-if="menu.subMenu && menu.activeDropdown"
                    :class="{ 'side-menu__sub-open': menu.activeDropdown }"
                  >
                    <li
                      v-for="(subMenu, subMenuKey) in menu.subMenu"
                      :key="subMenuKey"
                    >
                      <Tippy
                        as="a"
                        :content=" $t(subMenu.title)"
                        :options="{
                          placement: 'right',
                        }"
                        :disable="windowWidth > 1260"
                        :href="
                        subMenu.subMenu
                          ? '#'
                          : ((pageName: string | undefined) => {
                              try {
                                return router.resolve({
                                  name: pageName,
                                }).fullPath;
                              } catch (err) {
                                return '';
                              }
                            })(subMenu.pageName)
                      "
                        :class="[
                          subMenu.active
                            ? 'side-menu side-menu--active'
                            : 'side-menu',

                          // Animation
                          {
                            [`opacity-0 translate-x-[50px] animate-[0.4s_ease-in-out_0.1s_intro-menu] animate-fill-mode-forwards animate-delay-${
                              (subMenuKey + 1) * 10
                            }`]: !subMenu.active,
                          },
                        ]"
                        @click="(event: MouseEvent) => {
                        event.preventDefault();
                        linkTo(subMenu, router);
                        setFormattedMenu([...formattedMenu]);
                      }"
                      >
                        <div class="side-menu__icon">
                          <Lucide :icon="subMenu.icon" />
                        </div>
                        <div class="side-menu__title">
                          {{ $t(subMenu.title) }}
                          <div
                            v-if="subMenu.subMenu"
                            :class="[
                              'side-menu__sub-icon',
                              {
                                'transform rotate-180': subMenu.activeDropdown,
                              },
                            ]"
                          >
                            <Lucide icon="ChevronDown" />
                          </div>
                        </div>
                      </Tippy>
                      <Transition
                        @enter="enter"
                        @leave="leave"
                        v-if="subMenu.subMenu"
                      >
                        <ul
                          v-if="subMenu.subMenu && subMenu.activeDropdown"
                          :class="{
                            'side-menu__sub-open': subMenu.activeDropdown,
                          }"
                        >
                          <li
                            v-for="(
                              lastSubMenu, lastSubMenuKey
                            ) in subMenu.subMenu"
                            :key="lastSubMenuKey"
                          >
                            <Tippy
                              as="a"
                              :content="$t(lastSubMenu.title)"
                              :options="{
                                placement: 'right',
                              }"
                              :disable="windowWidth > 1260"
                              :href="
                              lastSubMenu.subMenu
                                ? '#'
                                : ((pageName: string | undefined) => {
                                    try {
                                      return router.resolve({
                                        name: pageName,
                                      }).fullPath;
                                    } catch (err) {
                                      return '';
                                    }
                                  })(lastSubMenu.pageName)
                            "
                              :class="[
                                lastSubMenu.active
                                  ? 'side-menu side-menu--active'
                                  : 'side-menu',

                                // Animation
                                {
                                  [`opacity-0 translate-x-[50px] animate-[0.4s_ease-in-out_0.1s_intro-menu] animate-fill-mode-forwards animate-delay-${
                                    (lastSubMenuKey + 1) * 10
                                  }`]: !lastSubMenu.active,
                                },
                              ]"
                              @click="(event: MouseEvent) => {
                              event.preventDefault();
                              linkTo(lastSubMenu, router);
                              setFormattedMenu([...formattedMenu]);
                            }"
                            >
                              <div class="side-menu__icon">
                                <Lucide :icon="lastSubMenu.icon" />
                              </div>
                              <div class="side-menu__title">
                                {{$t(lastSubMenu.title) }}
                              </div>
                            </Tippy>
                          </li>
                        </ul>
                      </Transition>
                    </li>
                  </ul>
                </Transition>
              </li>
            </template>
            <!-- END: First Child -->
          </ul>
        </nav>
        <!-- END: Side Menu -->
        <!-- BEGIN: Content -->
        <div
          class="pt-2 max-w-full md:max-w-auto rounded-xl flex-1 min-w-0 min-h-screen bg-white dark:bg-darkmode-800 before:content-[''] before:w-full before:h-px before:block border border-slate-200/70 dark:border-darkmode-700/80 shadow-sm"
        >
          <div class="border-b border-slate-200/60 px-4 md:px-6 dark:border-darkmode-700/60">
            <Breadcrumb />
          </div>
          <RouterView />
        </div>
        <!-- END: Content -->
      </div>
    </div>
  </div>
</template>
