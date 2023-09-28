import './main.css';
import './styles/variables.css';

import { App } from './components/app/app.js';
import { Map } from './components/map/map.js';
import { Navbar } from './components/navbar/navbar.js';

window.customElements.define('wcm-app', App);
window.customElements.define('wcm-map', Map);
window.customElements.define('wcm-navbar', Navbar);
