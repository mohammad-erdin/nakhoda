<template>
	<div class="page">
		<div class="hero">
			<div class="circle" />
		</div>

		<div class="page-inner">
			<div class="card">
				<div class="heading">
					<h1 class="text-lg font-semibold text-slate-100">
						Ayay Captain !
					</h1>
					<p class="text-xs text-slate-400">
						Enter your credentials please.
					</p>
				</div>

				<a-form
					layout="vertical"
					:model="formData"
					@finish="handleLogin"
					@finish-failed="onFinishFailed"
				>
					<a-form-item
						name="username"
						:rules="[{ required: true, message: 'Username is required' }]"
					>
						<a-input
							v-model:value="formData.username"
							placeholder="Username"
							size="middle"
						/>
					</a-form-item>

					<a-form-item
						name="password"
						:rules="[{ required: true, message: 'Password is required' }]"
					>
						<a-input-password
							v-model:value="formData.password"
							placeholder="Password"
							size="middle"
						/>
					</a-form-item>

					<a-button
						type="primary"
						html-type="submit"
						:loading="auth.isLoading"
						block
					>
						Login
					</a-button>
				</a-form>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/stores/auth';
import { notification } from 'ant-design-vue';

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
		const description = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Please check your input and try again.';
		notification.error({
			message: 'Login Failed',
			description,
		});
	}
};

const onFinishFailed = (errorInfo: any) => {
	console.log('Failed:', errorInfo);
};
</script>

<style scoped lang="scss">
  @reference 'tailwindcss';

  .page {
    @apply relative min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 overflow-hidden;
  }

  .hero {
    @apply pointer-events-none absolute inset-x-0 top-0 flex justify-center;
    transform: translateY(-25%);
    .circle {
      width: 50vw;
      height: 100vw;
      max-width: 90vh;
      max-height: 90vh;
      border-radius: 50%;
      filter: blur(120px);
      background: radial-gradient(circle at 50% 22%, rgba(59,130,246,0.2) 0%, rgba(100,116,139,0.06) 35%, transparent 65%);
    }
  }

  .page-inner {
    @apply min-h-screen w-full flex items-center justify-center px-4;
  }

  .card {
    @apply w-full max-w-[360px] rounded-xl p-6 border border-slate-600 bg-slate-900/50;
    box-shadow: 0 12px 40px rgba(2,6,23,0.6);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }

  .heading {
    @apply mb-4;
    h1 { @apply text-lg font-semibold text-slate-100; }
    p  { @apply text-xs text-slate-400; }
  }
</style>
