<template>
  <a-dropdown>
    <a-button size="small">
      Actions <i class="ri-arrow-down-s-line"></i>
    </a-button>
    <template #overlay>
      <a-menu>
        <a-menu-item @click="emit('start')">Start</a-menu-item>
        <a-menu-item @click="emit('stop')">Stop</a-menu-item>
        <a-menu-item @click="emit('restart')">Restart</a-menu-item>
        <a-menu-item danger @click="emit('delete')">Delete</a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import type { Container } from '@nakhoda/shared/types';

interface Props {
  container: Container;
}

defineProps<Props>();

const emit = defineEmits<{
  start: [];
  stop: [];
  restart: [];
  delete: [];
}>();
</script>
