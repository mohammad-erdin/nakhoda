<template>
	<div class="page px-6 py-6">
		<div class="page__title text-2xl font-semibold mb-0">
			Settings
		</div>
		<a-form
			layout="vertical"
			class="card"
		>
			<a-form-item label="Job Retention Days">
				<a-input-number
					v-model:value="jobRetentionDays"
					:min="1"
					:max="365"
					style="width: 200px"
				/>
			</a-form-item>
			<a-form-item label="Language">
				<a-select
					v-model:value="language"
					style="width: 200px"
				>
					<a-select-option value="en">
						English
					</a-select-option>
				</a-select>
			</a-form-item>
			<a-button
				type="primary"
				@click="save"
			>
				Save
			</a-button>
		</a-form>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useSettings } from '@/stores/settings';

const jobRetentionDays = ref(30);
const language = ref('en');

const settingsStore = useSettings();

onMounted(() => {
	const s = settingsStore.settings;
	if (s) {
		jobRetentionDays.value = s.jobRetentionDays || jobRetentionDays.value;
		language.value = s.language || language.value;
	}
});

const save = async () => {
	try {
		const payload = { jobRetentionDays: jobRetentionDays.value, language: language.value };
		await settingsStore.saveToApi(payload);
		message.success('Settings saved successfully');
	} catch (err) {
		message.error((err as Error).message || 'Failed to save settings');
	}
};
</script>
