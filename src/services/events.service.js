import { Observable } from '../helpers/observable.js';
import { SCALE } from '../enums.js';
import KDBush from 'kdbush';
import citiesLookup from '../assets/data/PPL.json'
import districtsLookup from '../assets/data/ADM2.json'
import regionsLookup from '../assets/data/ADM1.json'
import { around } from 'geokdbush-tk';
import { UNKNOWN_AFFECTED_TYPE } from '../constants.js';
import { StatsHelper } from '../helpers/stats.helper.js';

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
 * @property {string} [cityName]
 * @property {string[]} [affectedTypes]
 */

export class EventsService {

  /**
   * Observable that emits events that should be shown
   *
   * @type {Observable<CrimeEventGroup>}
   */
  shownEventsObservable = new Observable();

  /**
   * Observable that emits all affected types
   *
   * @type {Observable<AffectedType[]>}
   */
  affectedTypesObservable = new Observable();

  /**
   * Observable that emits all regions
   *
   * @type {Observable<Region[]>}
   */
  regionsObservable = new Observable();

  /**
   * Observable that emits individual events
   * @type {Observable<CrimeEvent>}
   */
  individualEventsObservable = new Observable();

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
   * KDBush cities index to use for searching
   *
   * @type {KDBush}
   */
  #citiesIndex = null;

  /**
   * Filter
   * @type {Filter}
   */
  #filter = {
    regionCode: null,
    districtCode: null,
    cityName: null,
    affectedTypes: [],
  };

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

    const allEvents = Object.keys(data)
      .flatMap((key) => data[key])
      .filter((event) => event.lat && event.lon)
      .map((event) => {
        const nearestIndex = around(this.#citiesIndex, event.lon, event.lat, 100)[0];
        const city = citiesLookup[nearestIndex];

        return {
          lat: event.lat,
          lon: event.lon,
          affectedType: event.affected_type ?? UNKNOWN_AFFECTED_TYPE,
          name: this.#eventMapping[event.event] ?? 'UNKNOWN',
          city: city.name,
          cityLat: city.lat,
          cityLon: city.lon,
          districtCode: city.ADM2Code,
          regionCode: city.ADM1Code
        }
      })
      .filter((event) => !!event.city);

    const cityGroups = this.#groupEventsByCity(allEvents);
    const districtGroups = this.#groupCitiesByDistricts(cityGroups);
    const regionGroups = this.#groupDistrictsByRegions(districtGroups);

    this.#allEvents = allEvents;
    this.#regions = regionGroups;

    this.#pushRegions();
    this.#pushAffectedTypes();
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
          events: [event],
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
    const districts = cityGroups.reduce((acc, city) => {
      const { districtCode, regionCode } = city;

      const existing = acc.find((item) => item.districtCode === districtCode);

      if (existing) {
        existing.cities.push(city);

        if (city.stats) {
          existing.stats = StatsHelper.mergeStats(existing.stats, city.stats);
        }
      } else {
        acc.push({
          districtCode,
          regionCode,
          cities: [city],
          stats: city.stats,
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
    const regions = districtGroups.reduce((acc, district) => {
      const { regionCode } = district;

      const existing = acc.find((item) => item.regionCode === regionCode);

      if (existing) {
        existing.districts.push(district);

        if (district.stats) {
          existing.stats = StatsHelper.mergeStats(existing.stats, district.stats);
        }
      } else {
        acc.push({
          regionCode,
          districts: [district],
          stats: district.stats,
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

      // set regions to individual events as well
      region.districts.forEach((district) => {
        district.cities.forEach((city) => {
          city.events.forEach((event) => {
            event.regionName = region.regionName;
          });
        });
      });
    });

    return regions;
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
    if (filterAwareScaleLevel === SCALE.DISTRICT && this.#filter.cityName) {
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
        const isCorrectCity = !this.#filter.cityName || event.city === this.#filter.cityName;
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
            return !this.#filter.cityName || city.city === this.#filter.cityName;
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
