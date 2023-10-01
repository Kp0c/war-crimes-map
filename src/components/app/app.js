import template from './app.html?raw';
import styles from './app.css?inline';
import eventsUrl from '/src/assets/data/events.json?url';
import namesUrl from '/src/assets/data/names.json?url';
import { EventsService } from '../../services/events.service.js';

const templateElement = document.createElement('template');
templateElement.innerHTML = template;

export class App extends HTMLElement {
  #eventsService = new EventsService();
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
    const mapComponent = this.shadowRoot.querySelector('wcm-map');
    const filterComponent = this.shadowRoot.querySelector('wcm-filter');

    mapComponent.addEventListener('scale-change', (event) => {
      const {scale} = event.detail;

      this.#eventsService.setScaleLevel(scale);
    }, {
      signal: this.#abortController.signal,
    });

    filterComponent.addEventListener('filter-change', (event) => {
      const { regionCode, districtCode, cityName, affectedTypes } = event.detail;

      this.#eventsService.setFilter({
        regionCode,
        districtCode,
        cityName,
        affectedTypes
      });
    });

    this.#eventsService.shownEventsObservable.subscribe((events) => {
      mapComponent.setEvents(events);
    }, {
      signal: this.#abortController.signal,
    });

    this.#eventsService.affectedTypesObservable.subscribe((affectedTypes) => {
      mapComponent.setAffectedTypes(affectedTypes);
      filterComponent.setAffectedTypes(affectedTypes);
    }, {
      signal: this.#abortController.signal,
    });

    this.#eventsService.regionsObservable.subscribe((regions) => {
      filterComponent.setRegions(regions);
    }, {
      signal: this.#abortController.signal,
    });

    this.#eventsService.init(eventsUrl, namesUrl).catch(console.error);
  }

  disconnectedCallback() {
    this.#abortController.abort();
  }
}
