import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import 'remixicon/fonts/remixicon.css';
import './styles/main.scss';
import App from './App.vue';
import router from './router';

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(Antd);

// Start auth check in background so App can show a spinner while checking
import { useAuth } from '@/stores/auth';
const auth = useAuth();
void auth.checkAuth();

app.mount('#app');
