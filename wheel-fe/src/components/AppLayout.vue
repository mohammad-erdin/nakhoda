<template>
  <a-layout class="min-h-screen">
    <a-layout-sider
      v-model:collapsed="ui.sidebarCollapsed"
      collapsible
      class="bg-[var(--color-surface)] border-r border-[var(--color-border)]"
      width="240"
    >
      <div class="h-16 flex items-center justify-center gap-2 px-4 text-[var(--color-text)] font-semibold border-b border-[var(--color-border)]">
        <span class="text-xl">⚓</span>
        <span v-if="!ui.sidebarCollapsed" class="text-sm truncate">Nakhoda</span>
      </div>
      <SidebarNav />
    </a-layout-sider>

    <a-layout>
      <TopBar />
      <a-layout-content class="p-6 bg-[var(--color-bg)]">
        <slot />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useUI } from '@/stores/ui';
import SidebarNav from '@/components/SidebarNav.vue';
import TopBar from '@/components/TopBar.vue';
import { useWebSocket } from '@/composables/useWebSocket';

const ui = useUI();
const { connect } = useWebSocket();

// Apply theme on mount
const applyTheme = () => {
  document.documentElement.setAttribute('data-theme', ui.theme);
};

onMounted(() => {
  // Apply theme from localStorage if present (ensure theme reflects cached settings immediately)
  try {
    const raw = localStorage.getItem('settings');
    if (raw) {
      const s = JSON.parse(raw);
      if (s?.theme) ui.setTheme(s.theme);
    }
  } catch (e) {
    // ignore
  }
  applyTheme();
  connect();
});

// Watch for theme changes
watch(() => ui.theme, () => {
  applyTheme();
});
</script>

<style scoped>
/* Keep the Ant trigger styling via deep selector */
.sider :deep(.ant-layout-sider-trigger) {
  background: var(--color-surface-alt) !important;
  border-top: 1px solid var(--color-border);
  color: var(--color-text) !important;
}
</style>
