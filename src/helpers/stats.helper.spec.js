import { StatsHelper } from './stats.helper.js';

describe('StatsHelper', () => {
  describe('mergeStats', () => {
    it('should return empty object if both stats are undefined', () => {
      expect(StatsHelper.mergeStats(undefined, undefined)).toEqual({});
    });

    it('should return stats1 if stats2 is undefined', () => {
      expect(StatsHelper.mergeStats({ a: 1 }, undefined)).toEqual({ a: 1 });
    });

    it('should return stats2 if stats1 is undefined', () => {
      expect(StatsHelper.mergeStats(undefined, { a: 1 })).toEqual({ a: 1 });
    });

    it('should return merged stats', () => {
      expect(StatsHelper.mergeStats({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
    });

    it('should return merged stats with sum', () => {
      expect(StatsHelper.mergeStats({ a: 1 }, { a: 2 })).toEqual({ a: 3 });
    });
  });
});
