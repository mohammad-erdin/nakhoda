<template>
  <div class="page">
    <div class="page__title">Settings</div>
    <a-form layout="vertical" class="card">
      <a-form-item label="Job Retention Days">
        <a-input-number v-model:value="jobRetentionDays" :min="1" :max="365" style="width: 200px" />
      </a-form-item>
      <a-form-item label="Language">
        <a-select v-model:value="language" style="width: 200px">
          <a-select-option value="en">English</a-select-option>
        </a-select>
      </a-form-item>
      <a-button type="primary" @click="save">Save</a-button>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { message } from 'ant-design-vue';

const jobRetentionDays = ref(30);
const language = ref('en');

const save = () => {
  message.success('Settings saved successfully');
};
</script>
