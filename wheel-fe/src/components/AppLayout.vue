<template>
  <a-layout class="layout">
    <a-layout-sider
      v-model:collapsed="ui.sidebarCollapsed"
      collapsible
      class="sider"
      width="240"
    >
      <div class="logo">
        <span class="logo__icon">⚓</span>
        <span v-if="!ui.sidebarCollapsed" class="logo__text">Nakhoda</span>
      </div>
      <SidebarNav />
    </a-layout-sider>

    <a-layout>
      <TopBar />
      <a-layout-content class="content">
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
.layout {
  min-height: 100vh;
}

.sider {
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
}

.sider :deep(.ant-layout-sider-trigger) {
  background: var(--color-surface-alt) !important;
  border-top: 1px solid var(--color-border);
  color: var(--color-text) !important;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 16px;
  color: var(--color-text);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
}

.logo__icon {
  font-size: 24px;
  flex-shrink: 0;
}

.logo__text {
  font-size: 16px;
  white-space: nowrap;
}

.content {
  padding: 24px;
  background: var(--color-bg);
}
</style>
