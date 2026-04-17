<template>
  <el-config-provider>
    <router-view />
  </el-config-provider>
</template>

<script setup>
</script>

<style>
/* 消除 Vite 默认间距 */
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}
</style>
