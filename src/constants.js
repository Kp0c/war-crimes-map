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

export const UNKNOWN_AFFECTED_TYPE = -1;

export const CRIME_TYPE_TO_COLOR_MAP = {
  UNKNOWN_AFFECTED_TYPE: "#EBEBEB",
  "30": "#1A1A1A",
  "31": "#FFA800",
  "32": "#76BCE3",
  "33": "#852D17",
  "34": "#F0552E"
}

export const CRIME_TYPE_BORDER_REQUIRED = {
  "30": true
}

export const DIFFUSE_AMOUNT_PX = 50;
