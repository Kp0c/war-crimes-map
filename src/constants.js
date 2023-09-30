/**
 * map boundaries in long/lat
 * @type {{lonMax: number, latMin: number, latMax: number, lonMin: number}}
 */
export const MAP_BOUNDARIES = {
  latMin: 44,
  latMax: 52.9,
  lonMin: 20,
  lonMax: 43.82,
};

/**
 * map boundaries ranges
 * @type {{latRange: number, lonRange: number}}
 */
export const MAP_BOUNDARIES_RANGES = {
  latRange: MAP_BOUNDARIES.latMax - MAP_BOUNDARIES.latMin,
  lonRange: MAP_BOUNDARIES.lonMax - MAP_BOUNDARIES.lonMin,
};
