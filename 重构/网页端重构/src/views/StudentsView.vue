<template>
  <div style="display: contents" v-html="innerHtml"></div>
</template>

<script setup>
import rawHtml from '../assets/raw_students_main.html?raw'
const innerHtml = rawHtml
</script>
