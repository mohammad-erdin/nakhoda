<template>
	<div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 min-w-[180px]">
		<div class="text-[var(--color-muted)] text-xs uppercase tracking-wider">
			{{ label }}
		</div>
		<div class="text-2xl font-semibold mt-1">
			{{ value }}
		</div>
		<div class="text-sm text-[var(--color-muted)] mt-2">
			<slot />
		</div>
	</div>
</template>

<script setup lang="ts">
interface Props {
  label: string;
  value: string | number;
}

defineProps<Props>();
</script>
