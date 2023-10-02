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

  /**
   * Linearly interpolates between two values based on a progress value.
   *
   * @param {number} from - The starting value.
   * @param {number} to - The ending value.
   * @param {number} progress - The progress value between 0 and 1.
   * @returns {number} - The interpolated value.
   */
  static lerp(from, to, progress) {
    return from + (to - from) * progress;
  }
}
