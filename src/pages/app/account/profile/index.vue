<script setup>
import ProfileCard from "../ProfileCard.vue";
import {useRoute} from "vue-router";
import {computed} from "vue";

const route = useRoute();
const path = computed(() => route.path.split("/").reverse()[0] ?? '');

</script>
<template>
  <section>
    <ProfileCard :currentTap="path"/>
    <RouterView/>
  </section>
</template>

<style scoped>
.image-fit {
  position: relative;

  & > img {
    position: absolute;
    object-fit: cover;
    top: 0;
    width: 100%;
    height: 100%;
  }
}
</style>