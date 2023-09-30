export class MathHelper {
  /**
   * Clamps a value between a minimum and maximum range.
   *
   * @param {Number} value - The value to be clamped.
   * @param {Number} min - The minimum value of the range.
   * @param {Number} max - The maximum value of the range.
   * @returns {Number} - The clamped value.
   */
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
}
