<template>
  <div class="page">
    <div class="page__title">Create Container</div>
    <a-form layout="vertical" @finish="handleSubmit" class="card">
      <a-form-item label="Rudder ID">
        <a-input v-model:value="form.rudder_id" placeholder="rudder-1" />
      </a-form-item>
      <a-form-item label="Image">
        <a-input v-model:value="form.image" placeholder="nginx:latest" />
      </a-form-item>
      <a-form-item label="Container Name">
        <a-input v-model:value="form.name" placeholder="web" />
      </a-form-item>
      <a-form-item label="Ports (JSON)">
        <a-textarea v-model:value="portsRaw" rows="3" placeholder='{"80": 8080}' />
      </a-form-item>
      <a-form-item label="Environment Variables (JSON)">
        <a-textarea v-model:value="envRaw" rows="3" placeholder='{"NODE_ENV": "production"}' />
      </a-form-item>
      <a-button type="primary" html-type="submit" :loading="containers.loading">Create</a-button>
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
  try {
    const ports = JSON.parse(portsRaw.value || '{}');
    const env = JSON.parse(envRaw.value || '{}');
    const payload = {
      ...form,
      ports,
      env,
    };

    const created = await containers.createContainer(payload);
    router.push(`/containers/${created.id}`);
  } catch (err) {
    message.error((err as Error).message || 'Invalid JSON input');
  }
};
</script>
