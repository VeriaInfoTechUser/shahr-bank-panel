<script setup lang="ts">

import { esgRepo } from '@/core/repositories/esgRepo';
import  ReportPdfContainer  from './ReportPdfContainer.vue';
import {onMounted, ref} from "vue";
const response = ref({})
async function loadDashboard() {
    response.value = await esgRepo.report({});
}
onMounted(()=>loadDashboard())
</script>

<template>
   <ReportPdfContainer  :response="response" v-if="response"/>
</template>
