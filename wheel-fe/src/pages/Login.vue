<template>
	<div class="page">
		<div class="hero">
			<div class="circle" />
		</div>

		<div class="top-panel">
			<div class="top-panel-content">
				<span class="text-slate-600 dark:text-white mr-2">Theme </span>
				<a-button
					type="text"
					@click="toggleTheme"
					class="theme-toggle"
				>
					<i
						v-if="!isDark"
						class="ri-sun-line"
					/>
					<i
						v-else
						class="ri-moon-line"
					/>
				</a-button>
			</div>
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
import { onMounted, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/stores/auth';
import { notification } from 'ant-design-vue';
import { useDisplay } from '@/composables/useDisplay';

const router = useRouter();
const route = useRoute();
const auth = useAuth();
const { isDark, toggleTheme } = useDisplay();
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
onMounted(() => {
	if(import.meta.env.DEV == true){
		formData.username = 'admin';
		formData.password = 'admin';
	}
});
</script>

<style scoped lang="scss">
@reference 'tailwindcss';

// default (light) mode
.page {
	@apply bg-white;
	@apply relative min-h-screen w-full overflow-hidden;
	transition: background-color .25s ease, color .25s ease;

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
			background: radial-gradient(circle at 50% 22%, rgba(59, 130, 246, 0.2) 0%, rgba(100, 116, 139, 0.06) 35%, transparent 65%);
		}
	}

	.top-panel {
		@apply fixed top-0 left-0 right-0 z-50 bg-transparent;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);

		.top-panel-content {
			@apply flex items-center justify-start px-6 py-4;

			.theme-toggle {
				@apply text-slate-600 hover:text-slate-800 transition-colors;

				:deep(.anticon) {
					font-size: 18px;
				}
			}
		}
	}

	.page-inner {
		@apply min-h-screen w-full flex items-center justify-center px-4;

		.card {
			@apply w-full max-w-[360px] rounded-xl p-6 border border-slate-200 bg-white;
			box-shadow: 0 6px 18px rgba(2, 6, 23, 0.06);
			-webkit-backdrop-filter: blur(6px);
			backdrop-filter: blur(6px);

			.heading {
				@apply mb-4;

				h1 {
					@apply text-lg font-semibold text-slate-900;
				}

				p {
					@apply text-xs text-slate-500;
				}
			}
		}
	}
}

// dark mode
.dark {
	.page {
		@apply bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950;
		color: #fff;

		.top-panel {
			.top-panel-content {
				.theme-toggle {
					@apply text-slate-300 hover:text-slate-100;
				}
			}
		}

		.page-inner {
			.card {
				@apply border border-slate-600 bg-slate-900/50;
				box-shadow: 0 8px 24px rgba(2, 6, 23, 0.25);

				.heading {
					h1 {
						@apply text-lg font-semibold text-slate-100;
					}

					p {
						@apply text-xs text-slate-400;
					}
				}
			}
		}
	}
}
</style>
