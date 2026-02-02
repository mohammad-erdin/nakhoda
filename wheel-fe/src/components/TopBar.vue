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
import { useSettings } from '@/stores/settings';

const router = useRouter();
const auth = useAuth();
const ui = useUI();
const settings = useSettings();

const toggleTheme = async () => {
  const newTheme = ui.theme === 'dark' ? 'light' : 'dark';

  // apply immediately for instant UX
  ui.setTheme(newTheme);

  // persist to localStorage (merge with existing settings if present)
  try {
    const raw = localStorage.getItem('settings');
    const parsed = raw ? JSON.parse(raw) : {};
    parsed.theme = newTheme;
    localStorage.setItem('settings', JSON.stringify(parsed));
  } catch (e) {
    // ignore localStorage errors
    // console.warn('Failed to update local settings', e);
  }

  // if authenticated, persist to server; otherwise keep local only
  if (auth.isAuthenticated) {
    try {
      await settings.saveToApi({ theme: newTheme });
    } catch (e) {
      // don't block the UI; optionally log
      // console.warn('Failed to save theme to server', e);
    }
  } else {
    // update in-memory settings store so other parts of app see the change
    try {
      settings.settings = { ...(settings.settings || {}), theme: newTheme } as any;
    } catch (e) {}
  }
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
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle:hover {
  color: var(--color-primary) !important;
}

.theme-toggle i {
  font-size: 20px;
  transition: transform 0.3s ease, color 0.3s ease;
}

.theme-toggle:hover i {
  transform: rotate(180deg);
}
</style>
