import template from './app.html?raw';
import styles from './app.css?inline';
import eventsUrl from '/src/assets/data/events.json?url';
import namesUrl from '/src/assets/data/names.json?url';
import { EventsService } from '../../services/events.service.js';

const templateElement = document.createElement('template');
templateElement.innerHTML = template;

export class App extends HTMLElement {
  #eventsService = new EventsService();
  #mapComponent;
  #abortController = new AbortController();

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = styles;

    shadow.appendChild(style);
    shadow.appendChild(templateElement.content.cloneNode(true));
  }

  connectedCallback() {
    this.#mapComponent = this.shadowRoot.querySelector('wcm-map');

    this.#eventsService.eventsObservable.subscribe((events) => {
      this.#mapComponent.setEvents(events);
    }, {
      signal: this.#abortController.signal,
    })

    setTimeout(() => {
      this.#eventsService.init(eventsUrl, namesUrl).catch(console.error);
    }, 0);
  }

  disconnectedCallback() {
    this.#abortController.abort();
  }
}
