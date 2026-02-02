<template>
  <div class="login">
    <div class="login__card">
      <h1>Ayay Captain !</h1>
      <p class="muted">Enter your credentials please.</p>

      <a-form 
        layout="vertical" 
        :model="formData" 
        @finish="handleLogin"
        @finishFailed="onFinishFailed"
      >
        <a-form-item 
          name="username"
          :rules="[{ required: true, message: 'Username is required' }]"
        >
          <a-input v-model:value="formData.username" placeholder="Username" />
        </a-form-item>
        <a-form-item 
          name="password"
          :rules="[{ required: true, message: 'Password is required' }]"
        >
          <a-input-password v-model:value="formData.password" placeholder="Password" />
        </a-form-item>
        <a-alert v-if="auth.error" type="error" :message="auth.error" show-icon style="margin-bottom: 16px;" />
        <a-button type="primary" html-type="submit" :loading="auth.isLoading" block>
          Login
        </a-button>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/stores/auth';
import type { FormInstance } from 'ant-design-vue';

const router = useRouter();
const route = useRoute();
const auth = useAuth();

const formData = reactive({
  username: '',
  password: '',
});

const handleLogin = async () => {
  try {
    await auth.login(formData.username, formData.password);
    const redirect = route.query.redirect as string | undefined;
    router.push(redirect || '/');
  } catch (err) {
    // handled by store
    console.error('Login error:', err);
  }
};

const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo);
};
</script>

<style scoped lang="scss">
@import '@/styles/mixins';

.login {
  min-height: 100vh;
  @include flex-center;
  background: radial-gradient(circle at top, #1e293b, #0b1220 60%);

  &__card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 32px;
    width: 360px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>
