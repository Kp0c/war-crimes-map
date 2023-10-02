import { UNKNOWN_AFFECTED_TYPE } from '../constants.js';
import { StatsHelper } from '../helpers/stats.helper';
import districtsLookup from '../assets/data/ADM2.json';
import regionsLookup from '../assets/data/ADM1.json';

onmessage = function(event) {
  const {
    cities,
    eventMapping,
    points
  } = event.data;

  postMessage({
    progress: 'Building cities index...'
  })

  const tree = buildKdTree(cities);

  const allEvents = Object.keys(points)
    .flatMap((key) => points[key])
    .filter((event) => event.lat && event.lon);

  const allEventsLength = allEvents.length;

  const mappedEvents = allEvents
    .map((event, index) => {
      postMessage({
        progress: {
          processed: index + 1,
          total: allEventsLength
        }
      })

      const city = nearestCity(tree, event);

      return {
        lat: event.lat,
        lon: event.lon,
        affectedType: event.affected_type ?? UNKNOWN_AFFECTED_TYPE,
        name: eventMapping[event.event] ?? 'UNKNOWN',
        city: city.name,
        cityLat: city.lat,
        cityLon: city.lon,
        districtCode: city.ADM2Code,
        regionCode: city.ADM1Code
      }
    });

  postMessage({
    progress: 'Grouping events...'
  });

  const cityGroups = groupEventsByCity(mappedEvents);
  const districtGroups = groupCitiesByDistricts(cityGroups);
  const regionGroups = groupDistrictsByRegions(districtGroups);

  postMessage({
    allEvents: mappedEvents,
    regions: regionGroups
  })
};

/**
 * Node
 * @typedef {Object} Node
 * @property {Node?} left
 * @property {Node?} right
 * @property {number} axis
 * @property {City} city
 */

/**
 * Point
 * @typedef {Object} Point
 * @property {number} lat
 * @property {number} lon
 */

/**
 * Builds a KD-Tree from the given array of cities
 *
 * @param {City[]} cities - The cities to build the tree from.
 * @param {number} [depth=0] - The current depth of the tree. Default is 0.
 * @returns {Node} The root of the KD Tree.
 */
function buildKdTree(cities, depth = 0) {
  if (cities.length === 0) {
    return null;
  }

  const axis = depth % 2;
  const axisProperty = axis === 0 ? 'lon' : 'lat';

  cities.sort((a, b) => a[axisProperty] - b[axisProperty]);

  const median = Math.floor(cities.length / 2);

  return {
    left: buildKdTree(cities.slice(0, median), depth + 1),
    right: buildKdTree(cities.slice(median + 1), depth + 1),
    axis,
    city: cities[median],
  };
}

/**
 * Converts degrees to radians.
 *
 * @param {number} degrees - The value in degrees to be converted.
 * @return {number} The converted value in radians.
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Get distance from the point to city using Haversine formula
 * see more: https://en.wikipedia.org/wiki/Haversine_formula
 *
 * @param {Point} point point
 * @param {City} city city coordinates
 * @private
 *
 * @returns {number} distance in km
 */
function getDistance(point, city) {
  const R = 6371; // Radius of the earth in km
  const dLat = toRadians(city.lat - point.lat);
  const dLon = toRadians(city.lon - point.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point.lat)) * Math.cos(toRadians(city.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}


/**
 * Finds the nearest city in a KD tree based on a given point.
 *
 * @param {Node} node - The root node of the binary tree.
 * @param {Object} point - The point to calculate the distance from.
 * @param {number} point.lat - The latitude of the point.
 * @param {number} point.lon - The longitude of the point.
 * @param {number} [depth=0] - The current depth of the node in the binary tree (default: 0).
 * @param {City} [best=null] - The current best city found (default: null).
 * @returns {City} - The nearest city based on the given point.
 */
function nearestCity(node, point, depth = 0, best = null) {
  if (node === null) {
    return best;
  }

  let axis = node.axis;
  let nextBest = null;
  let nextBranch = null;

  if (best == null || (getDistance(point, best) > getDistance(point, node.city))) {
    nextBest = node.city;
  } else {
    nextBest = best;
  }

  const property = axis === 0 ? 'lon' : 'lat';
  if (point[property] < node.city[property]) {
    nextBranch = node.left;
  } else {
    nextBranch = node.right;
  }

  return nearestCity(nextBranch, point, depth + 1, nextBest);
}


/**
 * Groups events by city.
 *
 * @param {Array} events - Array of events to be grouped by city.
 * @returns {Array<City>} - Array with cities
 */
function groupEventsByCity(events) {
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
 * @param {City[]} cities - An array containing cities.
 * @returns {Array<District>} - An array of districts with their corresponding cities.
 */
function groupCitiesByDistricts(cities) {
  const districts = cities.reduce((acc, city) => {
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
 * @param {Array<District>} districts - An array containing district data grouped by district names.
 * @returns {Array<Region>} - An array of regions with their corresponding district data.
 */
function groupDistrictsByRegions(districts) {
  const regions = districts.reduce((acc, district) => {
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
