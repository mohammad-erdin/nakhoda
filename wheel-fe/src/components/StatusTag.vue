<template>
  <a-tag :color="color" class="font-semibold uppercase tracking-wide">{{ label }}</a-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  status: string;
}

const props = defineProps<Props>();

const color = computed(() => {
  if (props.status === 'online' || props.status === 'done') return 'green';
  if (props.status === 'running') return 'blue';
  if (props.status === 'pending') return 'gold';
  if (props.status === 'failed' || props.status === 'offline') return 'red';
  if (props.status === 'exited' || props.status === 'stopped') return 'orange';
  return 'default';
});

const label = computed(() => props.status.toUpperCase());
</script> 
