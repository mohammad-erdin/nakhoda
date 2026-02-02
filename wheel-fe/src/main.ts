// App Entry Point
import { createApp } from 'vue';
import App from './App.vue';

// Plugins
import router from './router';
import { createPinia } from 'pinia';
import Antd from 'ant-design-vue';

// Styles
import 'ant-design-vue/dist/reset.css';
import 'remixicon/fonts/remixicon.css';
import './styles/main.scss';

(async () => {
    const app = createApp(App);
    const pinia = createPinia();
    app.use(pinia);
    app.use(router);
    app.use(Antd);
    app.mount('#app');

})();
