<template>
	<div class="border-dashed border-[var(--color-border)] rounded-lg p-8 flex flex-col items-center gap-2 text-[var(--color-muted)]">
		<i class="ri-inbox-2-line text-2xl" />
		<p>{{ message }}</p>
	</div>
</template>

<script setup lang="ts">
interface Props {
  message: string;
}

defineProps<Props>();
</script>
