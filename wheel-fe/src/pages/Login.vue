<template>
  <div class="login">
    <div class="login__card">
      <h1>Welcome to Nakhoda</h1>
      <p class="muted">Enter your access token to continue.</p>

      <a-form layout="vertical" @finish="handleLogin">
        <a-form-item label="Access Token">
          <a-input-password v-model:value="token" placeholder="Token" />
        </a-form-item>
        <a-alert v-if="auth.error" type="error" :message="auth.error" show-icon />
        <a-button type="primary" html-type="submit" :loading="auth.isLoading" block>
          Login
        </a-button>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/stores/auth';

const token = ref('');
const router = useRouter();
const route = useRoute();
const auth = useAuth();

const handleLogin = async () => {
  try {
    await auth.login(token.value);
    const redirect = route.query.redirect as string | undefined;
    router.push(redirect || '/');
  } catch {
    // handled by store
  }
};
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #1e293b, #0b1220 60%);
}

.login__card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 32px;
  width: 360px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
