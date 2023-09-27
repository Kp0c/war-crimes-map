import './common.css';

import { App } from './components/app/app.js';
import { Map } from './components/map/map.js';

window.customElements.define('wcm-app', App);
window.customElements.define('wcm-map', Map);
