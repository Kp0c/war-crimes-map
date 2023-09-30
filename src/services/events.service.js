import { Observable } from '../helpers/observable.js';
import { SCALE } from '../enums.js';
import KDBush from 'kdbush';
import citiesLookup from '../assets/data/PPL.json'
import districtsLookup from '../assets/data/ADM2.json'
import regionsLookup from '../assets/data/ADM1.json'
import { around } from 'geokdbush-tk';
import { UNKNOWN_AFFECTED_TYPE } from '../constants.js';

/**
 * Crime Event
 * @typedef {Object} CrimeEvent
 * @property {number} lat
 * @property {number} lon
 * @property {number} affectedType
 * @property {number} amount
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
 * @property {number} lat
 * @property {number} lon
 * @property {Record<string, number>} stats
 * @property {CrimeEvent[]} events
 */

export class EventsService {
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
   * KDBush cities index to use for searching
   *
   * @type {KDBush}
   */
  #citiesIndex = null;

  /**
   *
   * @type {Observable<CrimeEvent>}
   */
  shownEventsObservable = new Observable();

  constructor() {
    this.#citiesIndex = new KDBush(citiesLookup.length);

    citiesLookup.forEach((city) => {
      this.#citiesIndex.add(city.lon, city.lat);
    });

    this.#citiesIndex.finish();
  }

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

    const allEvents = Object.keys(data)
      .map((key) => data[key])
      .flat()
      .filter((event) => event.lat && event.lon)
      .map((event) => {
        const nearestIndex = around(this.#citiesIndex, event.lon, event.lat, 100)[0];
        const city = citiesLookup[nearestIndex];

        return {
          lat: event.lat,
          lon: event.lon,
          affectedType: event.affected_type ?? UNKNOWN_AFFECTED_TYPE,
          name: event.name,
          city: city.name,
          cityLat: city.lat,
          cityLon: city.lon,
          districtCode: city.ADM2Code,
          regionCode: city.ADM1Code,
        }
      })
      .filter((event) => !!event.city);

    const cityGroups = this.#groupEventsByCity(allEvents);
    const districtGroups = this.#groupCitiesByDistricts(cityGroups);
    const regionGroups = this.#groupDistrictsByRegions(districtGroups);

    this.#allEvents = allEvents;
    this.#regions = regionGroups;

    this.#pushNewEvents();
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
   * Groups events by city.
   *
   * @param {Array} events - Array of events to be grouped by city.
   * @returns {Array<City>} - Array with cities
   */
  #groupEventsByCity(events) {
    return events.reduce((acc, event) => {
      const existing = acc.find((item) => item.city === event.city);
      if (existing) {
        existing.events.push(event);

        if (event.affectedType) {
          if (existing.stats[event.affectedType]) {
            existing.stats[event.affectedType]++;
          } else {
            existing.stats[event.affectedType] = 1;
          }
        }
      } else {
        acc.push({
          districtCode: event.districtCode,
          regionCode: event.regionCode,
          city: event.city,
          lat: event.cityLat,
          lon: event.cityLon,
          events: [],
          stats: event.affectedType ? { [event.affectedType]: 1 } : {},
        })
      }

      return acc;
    }, []);
  }

  /**
   * Groups cities by districts.
   *
   * @param {Object} cityGroups - An object containing city groups.
   * @returns {Array<District>} - An array of districts with their corresponding cities.
   */
  #groupCitiesByDistricts(cityGroups) {
    const districts = Object.keys(cityGroups).reduce((acc, city) => {
      const { districtCode, regionCode } = cityGroups[city];

      const existing = acc.find((item) => item.districtCode === districtCode);

      if (existing) {
        existing.cities.push(cityGroups[city]);

        if (cityGroups[city].stats) {
          existing.stats = this.#mergeStats(existing.stats, cityGroups[city].stats);
        }
      } else {
        acc.push({
          districtCode,
          regionCode,
          cities: [cityGroups[city]],
          stats: cityGroups[city].stats,
        });
      }

      return acc;
    }, []);

    districts.forEach((district) => {
      const { districtCode } = district;

      const lookupValue = districtsLookup.find((district) => district.ADM2Code === districtCode);

      district.districtName = lookupValue?.name;
      district.lat = lookupValue?.lat;
      district.lon = lookupValue?.lon;
    });

    return districts;
  }

  /**
   * Groups district data by regions.
   *
   * @param {Array} districtGroups - An array containing district data grouped by district names.
   * @returns {Array<Region>} - An array of regions with their corresponding district data.
   */
  #groupDistrictsByRegions(districtGroups) {
    const regions = Object.keys(districtGroups).reduce((acc, district) => {
      const { regionCode } = districtGroups[district];

      const existing = acc.find((item) => item.regionCode === regionCode);

      if (existing) {
        existing.districts.push(districtGroups[district]);

        if (districtGroups[district].stats) {
          existing.stats = this.#mergeStats(existing.stats, districtGroups[district].stats);
        }
      } else {
        acc.push({
          regionCode,
          districts: [],
          stats: districtGroups[district].stats,
        });
      }

      return acc;
    }, []);

    regions.forEach((region) => {
      const { regionCode } = region;

      const lookupValue = regionsLookup.find((region) => region.ADM1Code === regionCode);

      region.regionName = lookupValue?.name;
      region.lat = lookupValue?.lat;
      region.lon = lookupValue?.lon;
    });

    return regions;
  }

  /**
   * Merge stats to accumulate values
   * @param {Record<string, number>} oldStats
   * @param {Record<string, number>} newStats
   */
  #mergeStats(oldStats, newStats) {
    const result = {};

    if (oldStats !== undefined) {
      Object.keys(oldStats).forEach((key) => {
        result[key] = oldStats[key];

        if (newStats[key]) {
          result[key] += newStats[key];
        }
      });
    }

    if (newStats !== undefined) {
      Object.keys(newStats).forEach((key) => {
        if (!result[key]) {
          result[key] = newStats[key];
        }
      });
    }

    return result;
  }

  /**
   * Pushes new events based on the current scale level.
   * Retrieves event data based on the current scale level and converts it into a standardized format.
   * Publishes the new events through an observable.
   */
  #pushNewEvents() {
    let events = [];
    if (this.#currentScaleLevel === SCALE.REGION) {
      events = this.#getRegionsEvents();
    } else if (this.#currentScaleLevel === SCALE.DISTRICT) {
      events = this.#getDistrictsEvents();
    } else if (this.#currentScaleLevel === SCALE.CITY) {
      events = this.#getCitiesEvents();
    }

    // split stats
    const resultEvents = events.flatMap((event) => {
      const { stats } = event;

      return Object.keys(stats).map((key) => {
        return {
          lat: event.lat,
          lon: event.lon,
          affectedType: key,
          amount: stats[key]
        }
      });
    });

    this.shownEventsObservable.next(resultEvents);
  }

  /**
   * Retrieves event data for cities.
   * @returns {{stats: Record<string, number>, lon: number, lat: number}[]}
   */
  #getCitiesEvents() {
    return this.#regions.flatMap((region) => {
      return region.districts.flatMap((district) => {
        return district.cities.map((city) => {
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
    return this.#regions.flatMap((region) => {
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
}
