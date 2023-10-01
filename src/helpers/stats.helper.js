export class StatsHelper {
  /**
   * Merge stats
   *
   * @param {Record<string, number>} stats1
   * @param {Record<string, number>} stats2
   *
   * @returns {Record<string, number>} result
   */
  static mergeStats(stats1, stats2) {
    const result = {};

    if (stats1 !== undefined) {
      Object.keys(stats1).forEach((key) => {
        result[key] = stats1[key];

        if (stats2?.[key]) {
          result[key] += stats2[key];
        }
      });
    }

    if (stats2 !== undefined) {
      Object.keys(stats2).forEach((key) => {
        if (!result[key]) {
          result[key] = stats2[key];
        }
      });
    }

    return result;
  }
}
