import { Formatter } from './formatter.js';

describe('Formatter', () => {
  describe('formatNumber', () => {
    [
      { input: 1000, expected: '1 000'},
      { input: 1000000, expected: '1 000 000'},
      { input: 12, expected: '12'},
      { input: -1000, expected: '-1 000'},
      { input: 0, expected: '0' }
    ].forEach((testCase) => {
      it(`should format number ${testCase.input} to ${testCase.expected}`, () => {
        expect(Formatter.formatNumber(testCase.input)).toEqual(testCase.expected);
      });
    });
  });
});
