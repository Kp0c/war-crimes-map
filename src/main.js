import { App } from './components/app/app.js';

window.customElements.define('wcm-app', App);

document.querySelector('#app').innerHTML = `
  <wcm-app></wcm-app>
`;
