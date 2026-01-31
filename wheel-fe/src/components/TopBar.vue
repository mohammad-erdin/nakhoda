<template>
  <a-layout-header class="topbar">
    <div class="topbar__left">
      <a-button type="text" @click="ui.toggleSidebar">
        <i class="ri-menu-line"></i>
      </a-button>
      <span class="topbar__title">Wheel Control</span>
    </div>
    <div class="topbar__right">
      <a-button 
        type="text" 
        class="theme-toggle"
        @click="toggleTheme"
        :title="`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} theme`"
      >
        <i :class="ui.theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'"></i>
      </a-button>
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

const toggleTheme = () => {
  const newTheme = ui.theme === 'dark' ? 'light' : 'dark';
  ui.setTheme(newTheme);
};

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
  color: var(--color-text);
}

.topbar__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.theme-toggle {
  font-size: 18px;
  color: var(--color-text) !important;
  transition: transform 0.3s ease, color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle:hover {
  color: var(--color-primary) !important;
  transform: rotate(180deg);
}

.theme-toggle i {
  font-size: 20px;
}
</style>
