<template>
  <a-menu theme="dark" mode="inline" :selectedKeys="selectedKeys" class="menu">
    <a-menu-item key="/">
      <router-link to="/"><i class="ri-speed-up-line"></i><span>Dashboard</span></router-link>
    </a-menu-item>
    <a-menu-item key="/rudders">
      <router-link to="/rudders"><i class="ri-router-line"></i><span>Rudders</span></router-link>
    </a-menu-item>
    <a-menu-item key="/containers">
      <router-link to="/containers"><i class="ri-box-3-line"></i><span>Containers</span></router-link>
    </a-menu-item>
    <a-menu-item key="/images">
      <router-link to="/images"><i class="ri-image-2-line"></i><span>Images</span></router-link>
    </a-menu-item>
    <a-menu-item key="/volumes">
      <router-link to="/volumes"><i class="ri-stack-line"></i><span>Volumes</span></router-link>
    </a-menu-item>
    <a-menu-item key="/jobs">
      <router-link to="/jobs"><i class="ri-list-check-2"></i><span>Jobs</span></router-link>
    </a-menu-item>
    <a-menu-item key="/settings">
      <router-link to="/settings"><i class="ri-settings-3-line"></i><span>Settings</span></router-link>
    </a-menu-item>
  </a-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const selectedKeys = computed(() => [route.path]);
</script>

<style scoped>
.menu {
  background: var(--color-surface);
  border-right: none;
}

.menu :deep(.ant-menu-item) {
  margin: 4px 8px;
  border-radius: 8px;
}

.menu :deep(.ant-menu-item a) {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
