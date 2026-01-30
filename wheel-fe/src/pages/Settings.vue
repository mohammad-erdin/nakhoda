<template>
  <div class="page">
    <div class="page__title">Settings</div>
    <a-form layout="vertical" class="card">
      <a-form-item label="Theme">
        <a-select v-model:value="theme" style="width: 200px">
          <a-select-option value="dark">Dark</a-select-option>
          <a-select-option value="light">Light</a-select-option>
        </a-select>
      </a-form-item>
      <a-button type="primary" @click="save">Save</a-button>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUI } from '@/stores/ui';

const ui = useUI();
const theme = ref(ui.theme);

const save = () => {
  ui.setTheme(theme.value);
};
</script>
