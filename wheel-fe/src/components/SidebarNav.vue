<template>
  <a-menu theme="dark" mode="inline" :selectedKeys="selectedKeys" :inlineCollapsed="collapsed" class="bg-[var(--color-surface)] border-none">
    <a-menu-item key="/">
      <router-link to="/" class="flex items-center gap-3 px-2 py-1 rounded-md">
        <i class="ri-speed-up-line text-lg flex-shrink-0"></i>
        <span v-if="!collapsed" class="ml-1">Dashboard</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="/rudders">
      <router-link to="/rudders" class="flex items-center gap-3 px-2 py-1 rounded-md">
        <i class="ri-router-line text-lg flex-shrink-0"></i>
        <span v-if="!collapsed" class="ml-1">Servers</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="/containers">
      <router-link to="/containers" class="flex items-center gap-3 px-2 py-1 rounded-md">
        <i class="ri-box-3-line text-lg flex-shrink-0"></i>
        <span v-if="!collapsed" class="ml-1">Containers</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="/images">
      <router-link to="/images" class="flex items-center gap-3 px-2 py-1 rounded-md">
        <i class="ri-image-2-line text-lg flex-shrink-0"></i>
        <span v-if="!collapsed" class="ml-1">Images</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="/volumes">
      <router-link to="/volumes" class="flex items-center gap-3 px-2 py-1 rounded-md">
        <i class="ri-stack-line text-lg flex-shrink-0"></i>
        <span v-if="!collapsed" class="ml-1">Volumes</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="/jobs">
      <router-link to="/jobs" class="flex items-center gap-3 px-2 py-1 rounded-md">
        <i class="ri-list-check-2 text-lg flex-shrink-0"></i>
        <span v-if="!collapsed" class="ml-1">Jobs</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="/settings">
      <router-link to="/settings" class="flex items-center gap-3 px-2 py-1 rounded-md">
        <i class="ri-settings-3-line text-lg flex-shrink-0"></i>
        <span v-if="!collapsed" class="ml-1">Settings</span>
      </router-link>
    </a-menu-item>
  </a-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUI } from '@/stores/ui';

const route = useRoute();
const ui = useUI();

const selectedKeys = computed(() => [route.path]);
const collapsed = computed(() => ui.sidebarCollapsed);
</script> 
