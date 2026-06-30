<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import Tippy from "../../base-components/Tippy";
import Lucide from "../../base-components/Lucide";
import TopBar from "../../components/TopBar";
import MobileMenu from "../../components/MobileMenu";
import { useSimpleMenuStore } from "../../stores/simple-menu";
import {
  ProvideForceActiveMenu,
  forceActiveMenu,
  Route,
  FormattedMenu,
  nestedMenu,
  linkTo,
  enter,
  leave,
} from "./simple-menu";
import { watch, reactive, computed, onMounted, provide } from "vue";

const route: Route = useRoute();
const router = useRouter();
let formattedMenu = reactive<Array<FormattedMenu | "divider">>([]);
const setFormattedMenu = (
  computedFormattedMenu: Array<FormattedMenu | "divider">
) => {
  Object.assign(formattedMenu, computedFormattedMenu);
};
const simpleMenuStore = useSimpleMenuStore();
const simpleMenu = computed(() => nestedMenu(simpleMenuStore.menu, route));

provide<ProvideForceActiveMenu>("forceActiveMenu", (pageName: string) => {
  forceActiveMenu(route, pageName);
  setFormattedMenu(simpleMenu.value);
});

watch(simpleMenu, () => {
  setFormattedMenu(simpleMenu.value);
});

watch(
  computed(() => route.path),
  () => {
    delete route.forceActiveMenu;
  }
);

onMounted(() => {
  setFormattedMenu(simpleMenu.value);
});
</script>

<template>
  <div
    class="pt-2 pb-7 before:content-[''] before:absolute before:inset-0 before:bg-fixed before:bg-no-repeat before:bg-skew-pattern dark:before:bg-skew-pattern-dark"
  >
    <MobileMenu />
    <TopBar />
    <div
      :class="[
        'relative',
        'before:content-[\'\'] before:w-[95%] before:z-[-1] before:rounded-[1.3rem] before:bg-white/10 before:h-full before:-mt-4 before:absolute before:mx-auto before:inset-x-0 before:dark:bg-darkmode-400/50',

        // Animation
        'before:translate-y-[35px] before:opacity-0 before:animate-[0.4s_ease-in-out_0.1s_intro-wrapper] before:animate-fill-mode-forwards',
      ]"
    >
      <div
        :class="[
          'translate-y-0 bg-primary flex rounded-[1.3rem] -mt-[7px] md:mt-0 dark:bg-darkmode-400',
          'before:block before:absolute before:inset-0 before:bg-black/[0.15] before:rounded-[1.3rem] before:z-[-1]',

          // Animation
          'animate-[0.4s_ease-in-out_0.2s_intro-wrapper] animate-fill-mode-forwards translate-y-[35px]',
        ]"
      >
        <!-- BEGIN: Simple Menu -->
        <nav
          class="side-nav side-nav--simple hidden md:block w-[105px] px-5 pt-8 pb-16 overflow-x-hidden"
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
                  :content="menu.title"
                  :options="{
                    placement: 'right',
                  }"
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
                    {{ menu.title }}
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
                        :content="subMenu.title"
                        :options="{
                          placement: 'right',
                        }"
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
                          {{ subMenu.title }}
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
                              :content="lastSubMenu.title"
                              :options="{
                                placement: 'right',
                              }"
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
                                {{ lastSubMenu.title }}
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
        <!-- END: Simple Menu -->
        <!-- BEGIN: Content -->
        <div
          class="px-4 md:px-[22px] max-w-full md:max-w-auto rounded-[1.3rem] flex-1 min-w-0 min-h-screen pb-10 shadow-sm bg-slate-100 dark:bg-darkmode-700 before:content-[''] before:w-full before:h-px before:block"
        >
          <RouterView />
        </div>
        <!-- END: Content -->
      </div>
    </div>
  </div>
</template>
