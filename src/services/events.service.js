import { Observable } from '../helpers/observable.js';
import { SCALE } from '../enums.js';
import citiesLookup from '../assets/data/PPL.json';
import ReverseGeocodingWorker from '../workers/reverse-geocoding-worker.js?worker';

/**
 * Crime Event Group
 * @typedef {Object} CrimeEventGroup
 * @property {number} lat
 * @property {number} lon
 * @property {number} affectedType
 * @property {number} amount
*/

/**
 * Crime Event
 * @typedef {Object} CrimeEvent
 * @property {number} lat
 * @property {number} lon
 * @property {number} affectedType
 * @property {string} name
 * @property {string} city
 * @property {string} cityId
 * @property {number} cityLat
 * @property {number} cityLon
 * @property {string} districtCode
 * @property {string} regionCode
 * @property {string} regionName
 */

/**
 * Event Type
 * @typedef {Object} AffectedType
 * @property {string} name
 * @property {string} affectedType
 */

/**
 * Region
 * @typedef {Object} Region
 * @property {string} regionCode
 * @property {string} regionName
 * @property {number} lat
 * @property {number} lon
 * @property {Record<string, number>} stats
 * @property {District[]} districts
 */

/**
 * District
 * @typedef {Object} District
 * @property {string} districtCode
 * @property {string} districtName
 * @property {number} lat
 * @property {number} lon
 * @property {Record<string, number>} stats
 * @property {City[]} cities
 */

/**
 * City
 * @typedef {Object} City
 * @property {string} city
 * @property {string} cityId
 * @property {number} lat
 * @property {number} lon
 * @property {Record<string, number>} stats
 * @property {CrimeEventGroup[]} events
 */

/**
 * Filter
 * @typedef {Object} Filter
 * @property {string} [regionCode]
 * @property {string} [districtCode]
 * @property {string} [cityId]
 * @property {string[]} [affectedTypes]
 */

export class EventsService {

  /**
   * Observable that emits events that should be shown
   *
   * @type {Observable<CrimeEventGroup[]>}
   */
  shownEventsObservable = new Observable([]);

  /**
   * Observable that emits all affected types
   *
   * @type {Observable<AffectedType[]>}
   */
  affectedTypesObservable = new Observable([]);

  /**
   * Observable that emits all regions
   *
   * @type {Observable<Region[]>}
   */
  regionsObservable = new Observable([]);

  /**
   * Observable that emits individual events
   * @type {Observable<CrimeEvent>}
   */
  individualEventsObservable = new Observable([]);

  /**
   * Observable that emits loading progress
   */
  loadingProgressObservable = new Observable('Loading data');

  /**
   * @type {Record<string, string>}
   */
  #affectedTypeMapping = {};

  /**
   * @type {Record<string, string>}
   */
  #eventMapping = {};

  /**
   * All events
   * @type {CrimeEvent[]}
   */
  #allEvents = [];

  /**
   * Regions
   * @type {Region[]}
   */
  #regions = [];

  /**
   * Current scale level
   * @type {SCALE|number}
   */
  #currentScaleLevel = SCALE.REGION;

  /**
   * Filter
   * @type {Filter}
   */
  #filter = {
    regionCode: null,
    districtCode: null,
    cityId: null,
    affectedTypes: [],
  };

  constructor() {
  }

  /**
   *
   * @param {string} dataUrl url to data
   * @param {string} namesUrl url to names
   * @returns {Promise<void>}
   */
  async init(dataUrl, namesUrl) {
    await this.#loadNames(namesUrl);
    await this.#loadEvents(dataUrl);
  }

  /**
   * Sets current scale level.
   * @param {SCALE} scale
   */
  setScaleLevel(scale) {
    this.#currentScaleLevel = scale;

    this.#pushNewEvents();
  }

  /**
   * Sets filter
   * @param {Filter} filter
   */
  setFilter(filter) {
    this.#filter = filter;

    this.#pushNewEvents();
  }

  /**
   *
   * @param {string} dataUrl url to data
   * @returns {Promise<void>}
   */
  async #loadEvents(dataUrl) {
    const response = await fetch(dataUrl);

    const data = await response.json();

    const reverseGeocodingWorker = new ReverseGeocodingWorker();

    reverseGeocodingWorker.postMessage({
      cities: citiesLookup,
      points: data,
      eventMapping: this.#eventMapping,
    });

    reverseGeocodingWorker.onmessage = (event) => {
      if (event.data.progress || typeof event.data.progress === 'string') {
        this.loadingProgressObservable.next(event.data.progress);
        return;
      }

      const { allEvents, regions } = event.data;

      this.#allEvents = allEvents;
      this.#regions = regions;

      this.#pushRegions();
      this.#pushAffectedTypes();
      this.#pushNewEvents();

      reverseGeocodingWorker.terminate();

      setTimeout(() => {
        this.loadingProgressObservable.next({
          completed: true
        });
      }, 50);
    };
  }

  /**
   * Pushes events based on the current scale level and filters.
   * Publishes events through an observable.
   */
  #pushNewEvents() {
    let filterAwareScaleLevel = this.#currentScaleLevel;

    // if the user has already filtered the region, it makes very little sense to show region-level.
    // so we show district-level instead
    if (filterAwareScaleLevel === SCALE.REGION && this.#filter.regionCode) {
      filterAwareScaleLevel = SCALE.DISTRICT;
    }

    // if the user has already filtered the city, it makes very little sense to show district-level.
    // so we show city-level instead
    if (filterAwareScaleLevel === SCALE.DISTRICT && this.#filter.cityId) {
      filterAwareScaleLevel = SCALE.CITY;
    }

    let events = [];
    if (filterAwareScaleLevel === SCALE.REGION) {
      events = this.#getRegionsEvents();
    } else if (filterAwareScaleLevel === SCALE.DISTRICT) {
      events = this.#getDistrictsEvents();
    } else if (filterAwareScaleLevel === SCALE.CITY) {
      events = this.#getCitiesEvents();
    }

    // split stats
    const resultGroups = events.flatMap((event) => {
      const { stats } = event;

      return Object.keys(stats)
        .filter((key) => {
          return !this.#filter.affectedTypes.length || this.#filter.affectedTypes.includes(key);
        })
        .map((key) => {
        return {
          lat: event.lat,
          lon: event.lon,
          affectedType: key,
          amount: stats[key]
        }
      });
    });

    this.shownEventsObservable.next(resultGroups);

    // get individual events
    const individualEvents = this.#allEvents
      .filter((event) => {
        const isCorrectAffectedType = !this.#filter.affectedTypes.length || this.#filter.affectedTypes.includes(event.affectedType.toString());
        const isCorrectRegion = !this.#filter.regionCode || event.regionCode === this.#filter.regionCode;
        const isCorrectCity = !this.#filter.cityId || event.cityId === this.#filter.cityId;
        return isCorrectAffectedType && isCorrectRegion && isCorrectCity;
      });

    this.individualEventsObservable.next(individualEvents);
  }

  /**
   * Retrieves event data for cities.
   * @returns {{stats: Record<string, number>, lon: number, lat: number}[]}
   */
  #getCitiesEvents() {
    return this.#regions
      .filter((region) => {
        return !this.#filter.regionCode || region.regionCode === this.#filter.regionCode;
      })
      .flatMap((region) => {
      return region.districts
        .filter((district) => {
          return !this.#filter.districtCode || district.districtCode === this.#filter.districtCode;
        })
        .flatMap((district) => {
        return district.cities
          .filter((city) => {
            return !this.#filter.cityId || city.cityId === this.#filter.cityId;
          })
          .map((city) => {
          const { lat, lon, stats } = city;

          return {
            lat,
            lon,
            stats
          };
        });
      });
    });
  }

  /**
   * Retrieves event data for districts.
   * @returns {{stats: Record<string, number>, lon: number, lat: number}[]}
   */
  #getDistrictsEvents() {
    return this.#regions
      .filter((region) => {
        return !this.#filter.regionCode || region.regionCode === this.#filter.regionCode;
      })
      .flatMap((region) => {
      return region.districts.map((district) => {
        const { lat, lon, stats } = district;

        return {
          lat,
          lon,
          stats
        };
      });
    });
  }

  /**
   * Retrieves event data for regions.
   * @returns {{stats: Record<string, number>, lon: number, lat: number}[]}
   */
  #getRegionsEvents() {
    return this.#regions.map((region) => {
      const { lat, lon, stats } = region;

      return {
        lat,
        lon,
        stats
      };
    });
  }

  /**
   * Loads names from the specified URL.
   *
   * @param {string} namesUrl - The URL from which to load the names.
   */
  async #loadNames(namesUrl) {
    const response = await fetch(namesUrl);

    const data = await response.json();

    this.#affectedTypeMapping = data[0].affected_type;
    this.#eventMapping = data[0].event;
  }

  /**
   * Pushes affected types to the observable
   */
  #pushAffectedTypes() {
    const mappedAffectedTypes = Object.keys(this.#affectedTypeMapping)
      .filter((key) => {
        return this.#allEvents.some((event) => event.affectedType === +key);
      })
      .map((key) => {
      return {
        name: this.#affectedTypeMapping[key],
        affectedType: key,
      };
    });

    this.affectedTypesObservable.next(mappedAffectedTypes);
  }

  /**
   * Pushes regions to the observable
   */
  #pushRegions() {
    this.regionsObservable.next(this.#regions);
  }
}
