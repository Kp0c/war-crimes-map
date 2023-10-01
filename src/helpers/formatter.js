export class Formatter {
  /**
   * Format number to string
   * @param number
   * @returns {string}
   */
  static formatNumber(number) {
    const numberString = number.toString();
    const numberLength = numberString.length;

    const parts = [];
    for (let i = numberLength - 1; i >= 0; i -= 3) {
      const part = numberString.slice(Math.max(i - 2, 0), i + 1);
      parts.push(part);
    }

    return parts.reverse().join(' ');
  }
}
