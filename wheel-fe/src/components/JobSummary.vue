<template>
	<div class="card bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
		<div class="flex items-center justify-between">
			<div>
				<div class="font-semibold">
					Jobs Summary
				</div>
				<div class="text-[var(--color-muted)]">
					Last 24 hours
				</div>
			</div>
			<a-button
				type="link"
				@click="$router.push('/jobs')"
			>
				View
			</a-button>
		</div>
		<div class="grid grid-cols-4 gap-3 mt-4">
			<div class="flex flex-col gap-2">
				<span class="text-[var(--color-muted)]">Pending</span>
				<strong>{{ counts.pending }}</strong>
			</div>
			<div class="flex flex-col gap-2">
				<span class="text-[var(--color-muted)]">Running</span>
				<strong>{{ counts.running }}</strong>
			</div>
			<div class="flex flex-col gap-2">
				<span class="text-[var(--color-muted)]">Done</span>
				<strong>{{ counts.done }}</strong>
			</div>
			<div class="flex flex-col gap-2">
				<span class="text-[var(--color-muted)]">Failed</span>
				<strong>{{ counts.failed }}</strong>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
interface Props {
  counts: { pending: number; running: number; done: number; failed: number };
}

defineProps<Props>();
</script>
