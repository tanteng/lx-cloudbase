import Vue from 'vue';
import VueRouter from 'vue-router';
Vue.use(VueRouter);

import routes from './router/index.js';
import App from './app.vue';

import cloudbase from '@cloudbase/js-sdk';
import { lxStorage } from './utils';

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);

Vue.config.productionTip = false;

const app = cloudbase.init({
  env: process.env.ENV_ID,
  region: process.env.REGION,
});
const auth = app.auth({
  persistence: process.env.PERSISTENCE
});
Vue.prototype.$app = app;
Vue.prototype.$auth = auth;

Vue.prototype.$company = { id: lxStorage.getItem('companyId') || '' };

const router = new VueRouter({
  base: '/',
  mode: 'history',
  routes,
});

router.beforeEach(async (to, from, next) => {
  const { company_id: companyId } = to.query;
  const loginCompanyId = Vue.prototype.$company.id;

  if (companyId) {
    if (loginCompanyId && companyId !== loginCompanyId) {
      lxStorage.clear();
    }

    const loginState = await Vue.prototype.$auth.getLoginState();
    console.log('loginState, loginUrl', loginState, loginUrl(companyId));
    if (!loginState) {
      window.location.href = loginUrl(companyId);
      return;
    }
  }
  
  next();
});

function loginUrl(company_id = null) {
  const redirect_uri = `${process.env.PAGE_URL}/auth-callback`;
  let params = `suite_id=${process.env.LX_SUITE_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=snsapi_userinfo`;

  if (company_id) {
    params = `${params}&company_id=${company_id}`;
  }

  sessionStorage.setItem('intendUrl', encodeURIComponent(window.location));

  return `${process.env.LX_AUTH_URL}?${params}`;
}

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
