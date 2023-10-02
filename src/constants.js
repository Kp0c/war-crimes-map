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

/**
 * Represents an unknown affected type.
 *
 * @type {number}
 */
export const UNKNOWN_AFFECTED_TYPE = -1;


/**
 * Map of crime types to color codes.
 *
 * @type {Record<string, string>}
 */
export const CRIME_TYPE_TO_COLOR_MAP = {
  "-1": "#7812D0", // for unknown
  "30": "#1A1A1A",
  "31": "#FFA800",
  "32": "#76BCE3",
  "33": "#852D17",
  "34": "#F0552E"
}

/**
 * Object representing the crime types that require border specifications.
 *
 * @type {Record<string, boolean>}
 */
export const CRIME_TYPE_BORDER_REQUIRED = {
  "30": true
}

/**
 * The amount of diffuse in pixels. It needed to move the dots from the same location and be able to differentiate them.
 *
 * @type {number}
 */
export const DIFFUSE_AMOUNT_PX = 20;

/**
 * The maximum number of records to be displayed in a list.
 *
 * @type {number}
 */
export const MAX_LIST_RECORDS = 100;

/**
 * The duration of an animation in milliseconds.
 *
 * @type {number}
 */
export const ANIMATION_DURATION_MS = 2000;
