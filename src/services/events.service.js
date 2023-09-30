/**
 * Crime Event
 * @typedef {Object} CrimeEvent
 * @property {number} lat
 * @property {number} lon
 * @property {number|null} affected_type
 */
import { Observable } from '../helpers/observable.js';

export class EventsService {
  #allEvents = [];

  /**
   *
   * @type {Observable<CrimeEvent>}
   */
  eventsObservable = new Observable();

  /**
   *
   * @param {string} dataUrl url to data
   * @param {string} namesUrl url to names
   * @returns {Promise<void>}
   */
  async init(dataUrl, namesUrl) {
    await this.#loadEvents(dataUrl);
  }

  /**
   *
   * @param {string} dataUrl url to data
   * @returns {Promise<void>}
   */
  async #loadEvents(dataUrl) {
    const response = await fetch(dataUrl);

    const data = await response.json();

    this.#allEvents = Object.keys(data).map((key) => data[key]).flat();

    this.eventsObservable.next(this.#allEvents);
  }
}
