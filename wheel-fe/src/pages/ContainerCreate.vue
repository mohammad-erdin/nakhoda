<template>
	<div class="page px-6 py-6">
		<div class="page__title text-2xl font-semibold mb-0">
			Create Container
		</div>
		<a-form
			layout="vertical"
			@finish="handleSubmit"
			@submit.prevent="handleSubmit"
			class="card"
		>
			<a-form-item label="Agent ID">
				<a-input
					v-model:value="form.rudder_id"
					placeholder="name"
				/>
			</a-form-item>
			<a-form-item label="Image">
				<a-input
					v-model:value="form.image"
					placeholder="nginx:latest"
				/>
			</a-form-item>
			<a-form-item label="Container Name">
				<a-input
					v-model:value="form.name"
					placeholder="web"
				/>
			</a-form-item>
			<a-form-item label="Ports (JSON)">
				<a-textarea
					v-model:value="portsRaw"
					:rows="3"
					placeholder="{&quot;80&quot;: 8080}"
				/>
			</a-form-item>
			<a-form-item label="Environment Variables (JSON)">
				<a-textarea
					v-model:value="envRaw"
					:rows="3"
					placeholder="{&quot;NODE_ENV&quot;: &quot;production&quot;}"
				/>
			</a-form-item>
			<a-button
				type="primary"
				html-type="submit"
				:loading="containers.loading"
			>
				Create
			</a-button>
		</a-form>
	</div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useContainers } from '@/stores/containers';

const router = useRouter();
const containers = useContainers();

const form = reactive({
	rudder_id: '',
	image: '',
	name: '',
});

const portsRaw = ref('{}');
const envRaw = ref('{}');

const handleSubmit = async () => {
	console.log('[UI] handleSubmit called', { form: { ...form } });

	// Basic client-side validation to give faster feedback
	if (!form.rudder_id || !form.image || !form.name) {
		message.error('Server ID, Image and Container Name are required');
		return;
	}

	try {
		const ports = JSON.parse(portsRaw.value || '{}');
		const env = JSON.parse(envRaw.value || '{}');
		const payload = {
			...form,
			ports,
			env,
		};

		const result = await containers.createContainer(payload);
		message.success('Container create job submitted');
		router.push(`/jobs/${result.jobId}`);
	} catch (err) {
		message.error((err as Error).message || 'Invalid JSON input');
	}
};
</script>
