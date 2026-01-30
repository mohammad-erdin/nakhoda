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
import { onMounted } from 'vue';
import { useUI } from '@/stores/ui';
import SidebarNav from '@/components/SidebarNav.vue';
import TopBar from '@/components/TopBar.vue';
import { useWebSocket } from '@/composables/useWebSocket';

const ui = useUI();
const { connect } = useWebSocket();

onMounted(() => {
  connect();
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

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  color: var(--color-text);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
}

.logo__icon {
  font-size: 20px;
}

.logo__text {
  font-size: 16px;
}

.content {
  padding: 24px;
  background: #0b1220;
}
</style>
