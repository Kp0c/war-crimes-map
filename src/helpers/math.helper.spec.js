import { MathHelper } from './math.helper.js';

describe('MathHelper', () => {
  describe('clamp', () => {
    it('returns the value if it is within the range', () => {
      const result = MathHelper.clamp(5, 0, 10);

      expect(result).toEqual(5);
    });

    it('returns the minimum value if the value is less than the minimum', () => {
      const result = MathHelper.clamp(-5, 0, 10);

      expect(result).toEqual(0);
    });

    it('returns the maximum value if the value is greater than the maximum', () => {
      const result = MathHelper.clamp(15, 0, 10);

      expect(result).toEqual(10);
    });
  });

  describe('lerp', () => {
    it('returns the value if the progress is 0', () => {
      const result = MathHelper.lerp(0, 10, 0);

      expect(result).toEqual(0);
    });

    it('returns the value if the progress is 1', () => {
      const result = MathHelper.lerp(0, 10, 1);

      expect(result).toEqual(10);
    });

    it('returns the interpolated value if the progress is between 0 and 1', () => {
      const result = MathHelper.lerp(0, 10, 0.5);

      expect(result).toEqual(5);
    });
  });
});
