<template>
  <div style="display: contents" v-html="innerHtml"></div>
</template>

<script setup>
import rawHtml from '../assets/raw_courses_main.html?raw'
const innerHtml = rawHtml
</script>
