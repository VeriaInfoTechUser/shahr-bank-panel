<script setup>
import Button from "../../../base-components/Button";
import {useRoute} from 'vue-router';
import logoUrl from "@/assets/images/logo.svg";
import {useFetch} from "@/composables/useFetch.js";
import {ref} from "vue";

const route = useRoute();

// Extract the `slug` parameter
const slug = route.params.slug;

// Extract query parameters
const authority = route.query.Authority;
const status = route.query.Status;
const response = ref(true)

// Handle the callback logic
if (status === 'OK') {
  console.log(`Transaction Successful! Slug: ${slug}, Authority: ${authority}`);
} else {
  console.log(`Transaction Failed. Slug: ${slug}, Status: ${status}`);
}
const loadingFlag = ref(true)

async function getResult() {
  loadingFlag.value = true
  try {
    const {data, error} = await useFetch(`api/wallet/ipg/return/${slug}`, {method: "GET"});
    if (error) {
    } else {
      response.value = data.status
      if(response.value){
        goHome()
      }
    }
  } catch (err) {
    console.log(err)
  } finally {
    loadingFlag.value = false;
  }
}

function goHome(){
  window.location.href = typeof window !== 'undefined' ? `${window.location.origin}/app` : '/app';
}

getResult()
</script>

<template>
  <div class="py-2" dir="rtl">
    <div class="container">
      <!-- BEGIN: Error Page -->
      <div
          class="flex flex-col items-center justify-center h-screen text-center error-page lg:flex-row lg:text-left"
      >
        <div class="-intro-x lg:mr-20">
          <img
              alt=" "
              class="w-[450px] h-48 lg:h-auto"
              :src="logoUrl"
          />
        </div>
        <div class="mt-10 text-white lg:mt-0">
          <div class="font-medium intro-x text-8xl" v-if="loadingFlag">
            <span class="relative h-36 w-36">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-36 w-36 bg-primary"></span>
            </span>
          </div>
          <div class="mt-5 text-xl font-medium intro-x text-start " dir="rtl">
            <span class="text-3xl" v-if="loadingFlag">
            در انتظار دریافت تاییدیه از سمت بانک لطفا منتظر بمانید ....
            </span>
            <span v-if="!response">
              متاسفانه پاسخی از بانک دریافت نشد. درصورت کسر مبلغ و عدم بازگشت آن بعد از ۷۲ ساعت با بانک تماس بگیرید.
            </span>
          </div>
          <div class="mt-3 text-lg intro-x text-start " dir="rtl">
             <span v-if="loadingFlag">
           لطفا تا دریافت پاسخ از بانک از این صفحه خارج نشوید.
             </span>
            <span v-if="!response">
              کد پیگیری
              <br/>
              {{authority}}
            </span>
          </div>
          <Button
              v-if="!loadingFlag&&!response"
              @click="goHome"
              class="px-4 py-3 mt-10 text-white border-white intro-x dark:border-darkmode-400 dark:text-slate-200"
          >
            بازگشت به پنل
          </Button>
        </div>
      </div>
      <!-- END: Error Page -->
    </div>
  </div>
</template>
