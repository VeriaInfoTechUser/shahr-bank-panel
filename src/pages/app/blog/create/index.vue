<script setup>
import {ref, watch, computed, nextTick, shallowRef} from 'vue'
import {useI18n} from "vue-i18n";

import {Form} from "vee-validate";
import Button from "@/base-components/Button/index";
import {base_url, uri} from "@/constants/config";
import {toast} from "vue3-toastify";
import {useFetch} from "@/composables/useFetch.js";
import {useRouter} from "vue-router";
import {FormSwitch} from "@/base-components/Form/index.js";

const {t: $t} = useI18n()
const isLoading = shallowRef(false)
const thumbnail = ref(null)
const relatedImages = ref([])
const image = ref(null)

const {
  data: metaData,
  error: metaError,
  isFetching: metaFetching,
  execute: fetchMetaData
} = useFetch(`${uri.admin.meta.list}`);

// Form Structure
const form = ref({
  slug: '',
  title: '',
  status: true,
  sub_title: '',
  abstract: '',
  description: '',
  related_images: [],
  meta: [],
  image: {
    src: '',
    alt: '',
    width: '',
    height: ''
  },
  thumbnail: {
    src: '',
    alt: '',
    width: '',
    height: ''
  }
})

// Available meta options
const availableMetaOptions = computed(() => {
  return metaData.value?.data?.list || [];
});

// Product-specific meta options
const productMetaOptions = computed(() => {
  return availableMetaOptions.value.filter(meta =>
      meta.option.types.some(type => type.type === 'blog')
  );
});

const fetchMetaContent = async (metaKey) => {
  const {data, error, execute} = useFetch(`${uri.admin.meta.value}`, {
    method: 'POST',
    body: {key: metaKey},
    immediate: false, // prevent auto-run
  });

  await execute(); // manually trigger the request
  await nextTick(); // ensure reactivity sync

  try {
    if (error?.value) {
      console.error('Fetch error:', error.value);
      return [];
    }

    return data?.value?.data?.list || [];
  } catch (err) {
    console.error('Unexpected error:', err);
    return [];
  }
};

function uid() {
  return "100 -1000-4000-8000-100 ".replace(/[018]/g, c =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
  );
}


// Load content for meta fields that need it
const loadMetaContent = async () => {
  if (!metaData.value?.data) return;

  // Check if category meta exists, if not add default after meta list is loaded
  const hasCategoryMeta = form.value.meta.some(m => m.meta_key === 'category');
  if (!hasCategoryMeta) {
    form.value.meta.push({
      meta_key: 'category',
      meta_information: {
        id: 20,
        icon: '',
        type: 'meta-category',
        title: 'Լրահոս',
        slug: 'meta-category-news',
        value: 'meta-category-news',
        time_create_view: '2025/12/08 12:55:45'
      },
      meta_value: 'meta-category-news',
      meta_value_object: null,
      contentOptions: [],
      isContentLoading: false
    });
  }

  for (const meta of form.value.meta) {
    const metaOption = availableMetaOptions.value.find(m => m.key === meta.meta_key);
    if (metaOption?.option.has_content) {
      meta.isContentLoading = true;
      meta.contentOptions = await fetchMetaContent(meta.meta_key);
      meta.isContentLoading = false;
      console.log(meta.contentOptions)
      // For existing values, find the matching option
      if (meta.meta_value && meta?.contentOptions?.length) {
        if (meta.meta_key === 'category' && false) {
          // Try to find by ID or slug
          const foundOption = meta?.contentOptions.find(
              opt => opt.slug === meta.meta_value || opt.slug === meta.meta_value
          ) || meta.meta_value_object;
          meta.meta_value_object = foundOption;
          meta.meta_information = foundOption;
        } else {
          const foundOption = meta?.contentOptions.find(
              opt => opt.slug === meta.meta_value
          );
          meta.meta_value_object = foundOption;
          meta.meta_information = foundOption;
        }
      }
    }
  }
}

// Watch for meta data changes
watch(metaData, loadMetaContent);

// Add new meta field
const addMetaField = () => {
  form.value.meta.push({
    meta_key: '',
    meta_value: '',
    meta_value_object: null,
    meta_information: null,
    contentOptions: [],
    isContentLoading: false
  });
}

// Remove meta field
const removeMetaField = (index) => {
  form.value.meta.splice(index, 1);
}

// Handle meta key change
const onMetaKeyChange = async (meta, index) => {
  meta.contentOptions = []
  const selectedMeta = availableMetaOptions.value.find(m => m.key === meta.meta_key);
  if (selectedMeta) {
    // Reset values
    meta.meta_value = '';
    meta.meta_value_object = null;
    meta.meta_information = null;

    // Fetch content if needed
    if (selectedMeta.option.has_content) {
      meta.isContentLoading = true;
      meta.contentOptions = await fetchMetaContent(meta.meta_key);
      meta.isContentLoading = false;
    }
  }
}

// Handle meta value change
const onMetaValueChange = (meta) => {
  if (meta.meta_key === 'category' && false) {
    const selectedOption = meta?.contentOptions.find(opt => opt.slug === meta.meta_value);
    meta.meta_value_object = selectedOption || null;
    meta.meta_value = selectedOption ? selectedOption.slug : '';
    meta.meta_information = selectedOption || null;
  } else {
    const selectedOption = meta?.contentOptions.find(opt => opt.slug === meta.meta_value);
    meta.meta_value_object = selectedOption || null;
    meta.meta_information = selectedOption || null;
  }
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const {data, error, execute} = useFetch(`${uri.admin.media.public.add}`, {
    method: 'POST',
    body: formData,
    immediate: false // prevent auto-run
  });

  await execute(); // wait for actual fetch to complete
  await nextTick();

  try {
    return data?.value?.data?.information?.download?.public_uri
  } catch (error) {
    return false
  }
}


const router = useRouter();
// Submit form
const handleSubmit = async () => {
  isLoading.value = true
  if (image.value) {
    const data = await uploadFile(image.value)
    if (data) {
      form.value.image.src = data
    } else {
      toast($t('error.error-upload-image'), {
        theme: "auto",
        type: "error",
        dangerouslyHTMLString: true
      });
      return false
    }
  }
  if (thumbnail.value) {
    const data = await uploadFile(thumbnail.value)
    if (data) {
      form.value.thumbnail.src = data
    } else {
      toast($t('error.error-upload-thumbnail'), {
        theme: "auto",
        type: "error",
        dangerouslyHTMLString: true
      });
      return false
    }
  }

  if (relatedImages.value.length > 0) {
    for (const img of relatedImages.value) {
      console.log(img.file)
      form.value.related_images.splice(form.value.related_images.indexOf(img?.data), 1)
      const data = await uploadFile(img?.file)
      if (data) {
        form.value.related_images.push(data)
      } else {
        toast($t('error.error-upload-related-images'), {
          theme: "auto",
          type: "error",
          dangerouslyHTMLString: true
        });
        false;
      }
    }
  }
  const submitData = {
    ...form.value,
    meta: form.value.meta.map(m => {
      const baseData = {
        meta_key: m.meta_key,
        meta_information: m.meta_information
      };
      if (m.meta_key === 'category' && m.meta_value_object && false) {
        return {
          ...baseData,
          meta_value: JSON.stringify(m.meta_value_object),
          meta_value_object: m.meta_value_object
        };
      }

      return {
        ...baseData,
        meta_value: m.meta_value
      };
    })
  };
  submitData.slug = submitData.slug.replace(/\s+/g, '-')
  submitData.slug = `${submitData.slug}-${uid()}`
  submitData.type = `blog`
  useFetch(`${uri.admin.blog.create}`, {
    body: {
      ...submitData
    }
  });
  await router.push({name: 'app-blog-list'})
  isLoading.value = false
};

const handleImageUpload = (event, type) => {
  const files = event.target.files;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        switch (type) {
          case 'image':
            image.value = file
            break
          case 'thumbnail':
            thumbnail.value = file
            break
          case 'related_images':
            relatedImages.value = [...relatedImages.value, {data: e.target.result, file: file}]
            break
        }
        if (type === 'related_images')
          form.value.related_images.push(e.target.result)
        else
          form.value[type].src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
};

function handleRemove(image) {
  form.value.related_images.splice(form.value.related_images.indexOf(image), 1);
  relatedImages.value.splice(relatedImages.value.find(item => item?.data === image), 1);
}


</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">{{ $t('blogs.create') }}</h1>
      <div class="flex flex-row gap-2">
        <button
            size="sm"
            type="button"
            @click="$router.back()"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
            size="sm"
            type="submit"
            form="productForm"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          {{ $t('common.save') }}
        </button>
      </div>
    </div>

    <div v-if=" metaFetching ||isLoading" class="animate-pulse space-y-6 grid grid-cols-1 gap-2">
      <div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-6">
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
              <div class="h-10 bg-gray-200 rounded"></div>
            </div>
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
              <div class="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded w-1/3"></div>
            <div class="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
      <div>
        <div class="grid grid-cols-1 md:grid-cols-1 gap-8">
          <div class="space-y-6">
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
              <div class="h-10 bg-gray-200 rounded"></div>
            </div>
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
              <div class="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded w-1/3"></div>
            <div class="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
      <div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-6">
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
              <div class="h-10 bg-gray-200 rounded"></div>
            </div>
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
              <div class="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded w-1/3"></div>
            <div class="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>


    <form
        v-else
        id="productForm"
        @submit.prevent="handleSubmit"
        class="grid grid-cols-1 md:grid-cols-1 gap-8"
    >


      <div
          class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-1 gap-2">
        <div>

          <div class="grid grid-cols-2 gap-2">
            <div class="max-w-xl my-2 ps-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('blogs.slug') }} *</label>
              <input
                  v-model="form.slug"
                  type="text"
                  class=" ltr text-end w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
              >
            </div>

            <div class="relative w-full m-10">
              <div class="flex gap-3 right-0 w-36" dir="ltr">
                <div :class="{'text-slate-300 font-think': form.status}">
                  {{ $t('title.inactive') }}
                </div>
                <FormSwitch class="flex flex-row items-start">
                  <FormSwitch.Input id="post-form-6" type="checkbox" class="xs" v-model="form.status"/>
                </FormSwitch>
                <div :class="{'text-slate-300 font-think': !form.status}">
                  {{ $t('title.active') }}
                </div>
              </div>
            </div>

          </div>


          <!-- Images Section -->
          <div class="p-4 rounded-lg">
            <div class="grid grid-cols-1 gap-2">
              <span class="border-b-2 text-xl font-semibold border-blue-500 pb-1">{{ $t('blogs.images') }}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Main Image -->
              <div class="grid grid-cols-1 gap-2 mt-2">
                <div class="flex flex-row gap-2">
                  <div class="pt-2 w-full">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('blogs.main_image') }}</label>
                  </div>
                  <div>
                    <input
                        type="file"
                        @change="(e) => handleImageUpload(e, 'image')"
                        accept="image/*"
                        class="hidden"
                        id="mainImageUpload"
                    >

                    <div class="w-32">
                      <label
                          for="mainImageUpload"
                          class="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        {{ $t('blogs.upload_image') }}
                      </label>
                    </div>
                  </div>
                </div>
                <div class="flex items-start gap-2">
                  <div class="flex-1">
                    <div
                        class="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img
                          v-if="form.image.src"
                          :src="form.image.src"
                          class="w-full h-full object-contain"
                          alt="">
                      <div v-else class="text-center p-4 text-gray-400">
                        <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <p class="text-sm">{{ $t('blogs.no_image') }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Thumbnail Image -->
              <div class="grid grid-cols-1 gap-2 mt-2">
                <div class="flex flex-row gap-2">
                  <div class="pt-2 w-full">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('blogs.thumbnail') }}</label>
                  </div>
                  <div>
                    <input
                        type="file"
                        @change="(e) => handleImageUpload(e, 'thumbnail')"
                        accept="image/*"
                        class="hidden"
                        id="thumbnailUpload"
                    >
                    <div class="w-32">
                      <label
                          for="thumbnailUpload"
                          class="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        {{ $t('blogs.upload_image') }}
                      </label>
                    </div>
                  </div>
                </div>
                <div class="flex items-start gap-2">
                  <div class="flex-1">
                    <div
                        class="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img
                          v-if="form.thumbnail.src"
                          :src="form.thumbnail.src"
                          class="w-full h-full object-contain"
                          alt="">
                      <div v-else class="text-center p-4 text-gray-400">
                        <svg class="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <p class="text-xs">{{ $t('blogs.no_image') }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-10">
              <!-- Related Images -->
              <div class="grid grid-cols-1 gap-2">
                <span class="border-b-2 border-blue-500 pb-1">
                      {{ $t('blogs.related_images') }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2 py-2">
                <div>
                  <input
                      type="file"
                      @change="(e) => handleImageUpload(e, 'related_images')"
                      accept="image/*"
                      multiple
                      class="hidden"
                      id="relatedUpload"
                  >
                  <div class="w-32">
                    <label
                        for="relatedUpload"
                        class="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors mb-3"
                    >
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                      </svg>
                      {{ $t('blogs.add_images') }}
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <div v-if="form?.related_images?.length > 0" class="flex flex-wrap gap-3">
                  <div v-for="(image, index) in form.related_images" :key="index" class="relative group">
                    <img
                        :src="image"
                        alt="Related image"
                        class="w-full h-24 object-cover rounded border border-gray-200"
                    />
                    <button
                        @click="handleRemove(image)"
                        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div v-else class="text-center py-4 text-gray-400 text-sm">
                  <p>{{ $t('blogs.no_related_images') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
          class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-1 gap-2">
        <!-- Basic Information -->
        <div class="p-4 rounded-lg grid grid-cols-1 gap-8">
          <div class="grid grid-cols-1 gap-2">
            <span class="border-b-2 text-xl font-semibold border-blue-500 pb-1">{{ $t('blogs.basic_info') }}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="grid grid-cols-1 gap-2 ">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('blogs.title') }} *</label>
                <input
                    v-model="form.title"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('blogs.abstract') }}</label>
                <textarea
                    v-model="form.abstract"
                    rows="5"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                ></textarea>
              </div>


            </div>
            <div class="grid grid-cols-1 gap-2 ">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('blogs.subtitle') }}</label>
                <input
                    v-model="form.sub_title"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('blogs.description') }}</label>
                <textarea
                    v-model="form.description"
                    rows="5"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div
          class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-1 gap-2">


        <!-- Meta Fields Section -->
        <div class="p-4 rounded-lg grid grid-cols-1 gap-8">
          <div class="flex flex-row border-b-2 border-blue-500">
            <div class="w-full">
              <span class=" text-xl font-semibold pb-1">{{ $t('blogs.meta_info') }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-8">
            <div v-for="(meta, index) in form.meta" :key="index"
                 class="p-4 bg-gray-50 border border-gray-200 rounded-md shadow-xs">

              <div class="flex justify-between items-center mb-3">
                <label class="block text-sm font-medium text-gray-700">{{ $t('common.key') }}</label>
                <button
                    type="button"
                    @click="removeMetaField(index)"
                    class="text-red-500 hover:text-red-700 text-sm flex items-center"
                >
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  {{ $t('common.remove') }}
                </button>
              </div>

              <select
                  dir="rtl"
                  style="direction: rtl"
                  v-model="meta.meta_key"
                  @change="onMetaKeyChange(meta, index)"
                  class="appearance-none w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3 text-sm transition"
              >
                <option value="">{{ $t('common.select') }}</option>
                <option
                    v-for="option in productMetaOptions"
                    :value="option.key"
                    :key="option.slug"
                    :disabled="form.meta.some((m, i) => m.meta_key === option.key && i !== index && !option.option.types[0].multi)"
                >
                  {{ option.value }}
                </option>
              </select>

              <template v-if="meta.meta_key">
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('common.value') }}</label>

                <!-- Loading state -->
                <div v-if="meta.isContentLoading" class="h-8 bg-gray-200 rounded animate-pulse"></div>

                <!-- Select input for content options -->
                <template v-else-if="meta?.contentOptions?.length > 0">
                  <select
                      dir="rtl"
                      style="direction: rtl"
                      v-model="meta.meta_value"
                      @change="onMetaValueChange(meta)"
                      class="appearance-none w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3 text-sm transition"

                  >
                    <option value="">{{ $t('blogs.select_option') }}</option>
                    <option
                        v-for="option in meta?.contentOptions"
                        :value="option.slug"
                        :key="option.slug"
                    >
                      {{ option.title }}
                    </option>
                  </select>

                  <!-- Display selected category info -->
                  <div v-if=" meta.meta_value_object"
                       class="mt-2 p-3 bg-gray-50 rounded border border-gray-200 flex items-start">
                    <img
                        v-if="meta.meta_value_object.image_url"
                        :src="meta.meta_value_object.image_url"
                        class="w-12 h-12 object-cover rounded mr-3"
                        alt="">
                    <div class="flex-1">
                      <p class="font-medium text-sm">{{ meta.meta_value_object.title }}</p>
                      <p class="text-xs text-gray-500 mt-1">{{ meta.meta_value_object.slug }}</p>
                    </div>
                  </div>
                </template>

                <!-- Textarea for long text fields -->
                <textarea
                    v-else-if="['use-cases', 'combinations', 'contraindications', 'consumption-method'].includes(meta.meta_key)"
                    v-model="meta.meta_value"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                ></textarea>

                <!-- Number input for numeric fields -->
                <input
                    v-else-if="['price', 'inventory', 'weight', 'serving'].includes(meta.meta_key)"
                    v-model="meta.meta_value"
                    type="number"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                >

                <!-- Default text input -->
                <input
                    v-else
                    v-model="meta.meta_value"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                >
              </template>

            </div>
          </div>
          <div class="w-full items-end justify-end tex†-end">
            <button
                type="button"
                @click="addMetaField"
                class="text-primary text-base font-semibold"
            >
              <div class="flex flex-row">

                <svg class="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                {{ $t('common.add_field') }}
              </div>
            </button>
          </div>
        </div>

      </div>


    </form>
  </div>
</template>