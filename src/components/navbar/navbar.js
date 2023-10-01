import template from './navbar.html?raw';
import styles from './navbar.css?inline';

const templateElement = document.createElement('template');
templateElement.innerHTML = template;

export class Navbar extends HTMLElement {
  /**
   * Controller that emits when the component is destroyed.
   * @type {AbortController}
   */
  #destroyController = new AbortController();

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = styles;

    shadow.appendChild(style);
    shadow.appendChild(templateElement.content.cloneNode(true));
  }

  connectedCallback() {
    window.addEventListener('hashchange', () => {
      this.#markActiveRoute();
    }, {
      signal: this.#destroyController.signal,
    });

    this.#markActiveRoute();
  }

  #markActiveRoute() {
    const navLinks = this.shadowRoot.querySelectorAll('nav > a');
    const currentHash = window.location.hash.slice(1);

    navLinks.forEach((link) => {
      link.classList.remove('active');

      if (link.getAttribute('href').slice(1) === currentHash) {
        link.classList.add('active');
      }
    });
  }
}
