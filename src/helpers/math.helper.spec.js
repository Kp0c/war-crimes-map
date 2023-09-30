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
});
