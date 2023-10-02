import template from './list.html?raw';
import styles from './list.css?inline';
import { MAX_LIST_RECORDS } from '../../constants.js';
import { Formatter } from '../../helpers/formatter.js';

const templateElement = document.createElement('template');
templateElement.innerHTML = template;

export class List extends HTMLElement {
  /**
   * Controller that emits when the component is destroyed.
   * @type {AbortController}
   */
  #destroyController = new AbortController();

  /**
   * events to render
   *
   * @type {CrimeEvent[]}
   */
  #events = [];

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = styles;

    shadow.appendChild(style);
    shadow.appendChild(templateElement.content.cloneNode(true));
  }

  /**
   * set events
   *
   * @param {CrimeEvent[]} events events
   */
  setEvents(events) {
    this.#events = events;
    this.#render();
  }

  disconnectedCallback() {
    this.#destroyController.abort();
  }

  #render() {
    const cardsContainer = this.shadowRoot.getElementById('cards-container')
    cardsContainer.innerHTML = '';

    this.#events
      .slice(0, MAX_LIST_RECORDS)
      .forEach((event) => {
        const html = `<div class="crime-card">
          <h2>${event.name}</h2>

          <div class="field">
            <span class="field-label">Region</span>
            <span class="field-value">${event.regionName}</span>
          </div>

          <div class="field">
            <span class="field-label">City / Town</span>
            <span class="field-value">${event.city}</span>
          </div>
        </div>`

        cardsContainer.innerHTML += html;
      });

    const moreResults = this.shadowRoot.getElementById('more-results');
    if (this.#events.length > MAX_LIST_RECORDS) {
      const hiddenCrimesNumber = Formatter.formatNumber(this.#events.length - MAX_LIST_RECORDS);
      moreResults.innerHTML = `<h2>... And ${hiddenCrimesNumber} more crimes. Please filter the list to see more precise results.</h2>`;
      moreResults.style.display = 'block';
    } else {
      moreResults.style.display = 'none';
    }
  }
}
