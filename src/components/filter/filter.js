import template from './filter.html?raw';
import styles from './filter.css?inline';

const templateElement = document.createElement('template');
templateElement.innerHTML = template;

export class Filter extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = styles;

    shadow.appendChild(style);
    shadow.appendChild(templateElement.content.cloneNode(true));
  }
}
