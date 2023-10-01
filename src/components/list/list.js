import template from './list.html?raw';
import styles from './list.css?inline';

const templateElement = document.createElement('template');
templateElement.innerHTML = template;

export class List extends HTMLElement {
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
}
