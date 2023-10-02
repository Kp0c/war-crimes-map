import template from './app.html?raw';
import styles from './app.css?inline';
import eventsUrl from '/src/assets/data/events.json?url';
import namesUrl from '/src/assets/data/names.json?url';
import { EventsService } from '../../services/events.service.js';
import { Formatter } from '../../helpers/formatter.js';

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

  async connectedCallback() {
    const loadingProgressText = this.shadowRoot.getElementById('progress-text');
    this.#eventsService.loadingProgressObservable.subscribe((progress) => {
      if (typeof progress === 'string') {
        loadingProgressText.textContent = progress;
        return;
      }

      loadingProgressText.textContent = `Geolocating cities: ${Formatter.formatNumber(progress.processed)} / ${Formatter.formatNumber(progress.total)}`;

      if (progress.processed === progress.total) {
        const spinner = this.shadowRoot.getElementById('spinner');
        spinner.parentNode.removeChild(spinner);
      }
    }, {
      signal: this.#abortController.signal,
      pushLatestValue: true,
    });

    await this.#eventsService.init(eventsUrl, namesUrl).catch(console.error);

    window.addEventListener('hashchange', () => {
      this.#selectRoute();
    }, {
      signal: this.#abortController.signal,
    });

    this.#selectRoute();
    this.#setupFilter();
  }

  disconnectedCallback() {
    this.#abortController.abort();
  }

  #selectRoute() {
    const { hash } = window.location;
    const location = hash.replace('#', '');

    if (location === 'list') {
      // we need to adjust background color to white to avoid black gaps on rounded corners
      document.body.style.backgroundColor = 'white';
      this.#showListView();
    } else if (location === 'map') {
      document.body.style.backgroundColor = '';
      this.#showMapView();
    } else {
      // default route
      window.location.hash = '#map';
    }
  }

  #showMapView() {
    const routerSlot = this.shadowRoot.getElementById('router-slot');
    routerSlot.innerHTML = '';
    const mapComponent = document.createElement('wcm-map');
    routerSlot.appendChild(mapComponent);

    mapComponent.addEventListener('scale-change', (event) => {
      const {scale} = event.detail;

      this.#eventsService.setScaleLevel(scale);
    }, {
      signal: this.#abortController.signal,
    });

    this.#eventsService.shownEventsObservable.subscribe((events) => {
      mapComponent.setEvents(events);
    }, {
      signal: this.#abortController.signal,
      pushLatestValue: true,
    });

    this.#eventsService.affectedTypesObservable.subscribe((affectedTypes) => {
      mapComponent.setAffectedTypes(affectedTypes);
    }, {
      signal: this.#abortController.signal,
      pushLatestValue: true,
    });
  }

  #showListView() {
    const routerSlot = this.shadowRoot.getElementById('router-slot');
    routerSlot.innerHTML = '';
    const listComponent = document.createElement('wcm-list');
    routerSlot.appendChild(listComponent);

    this.#eventsService.individualEventsObservable.subscribe((events) => {
      listComponent.setEvents(events);
    }, {
      signal: this.#abortController.signal,
      pushLatestValue: true,
    });
  }

  #setupFilter() {
    const filterComponent = this.shadowRoot.querySelector('wcm-filter');

    filterComponent.addEventListener('filter-change', (event) => {
      const { regionCode, districtCode, cityId, affectedTypes } = event.detail;

      this.#eventsService.setFilter({
        regionCode,
        districtCode,
        cityId,
        affectedTypes
      });
    });

    this.#eventsService.regionsObservable.subscribe((regions) => {
      filterComponent.setRegions(regions);
    }, {
      signal: this.#abortController.signal,
      pushLatestValue: true,
    });

    this.#eventsService.affectedTypesObservable.subscribe((affectedTypes) => {
      filterComponent.setAffectedTypes(affectedTypes);
    }, {
      signal: this.#abortController.signal,
      pushLatestValue: true,
    });
  }
}
