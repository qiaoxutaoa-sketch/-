<template>
  <div style="display: contents" v-html="innerHtml"></div>
</template>

<script setup>
import rawHtml from '../assets/raw_secret_main.html?raw'
const innerHtml = rawHtml
</script>
