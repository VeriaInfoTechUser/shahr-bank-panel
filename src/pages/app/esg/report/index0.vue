<script setup>
import ESGReport from './ESGReport.vue'
import {esgRepo} from "@core/repositories/esgRepo.js";

  const reportData = await esgRepo.dashboard({})
</script>

<template>
  <ESGReport :report-data="reportData"/>
</template>