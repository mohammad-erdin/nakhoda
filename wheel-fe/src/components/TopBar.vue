<template>
  <a-layout-header class="topbar">
    <div class="topbar__left">
      <a-button type="text" @click="ui.toggleSidebar">
        <i class="ri-menu-line"></i>
      </a-button>
      <span class="topbar__title">Wheel Control</span>
    </div>
    <div class="topbar__right">
      <span class="muted">{{ auth.user?.name || 'Operator' }}</span>
      <a-button type="primary" danger @click="handleLogout">Logout</a-button>
    </div>
  </a-layout-header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuth } from '@/stores/auth';
import { useUI } from '@/stores/ui';

const router = useRouter();
const auth = useAuth();
const ui = useUI();

const handleLogout = () => {
  auth.logout();
  router.push({ name: 'Login' });
};
</script>

<style scoped>
.topbar {
  height: 64px;
  padding: 0 24px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.topbar__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar__title {
  font-weight: 600;
}

.topbar__right {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
