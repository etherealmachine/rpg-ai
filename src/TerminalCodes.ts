class TerminalCodes {
  static Black = "\u001b[30m"
  static Red = "\u001b[31m"
  static Green = "\u001b[32m"
  static Yellow = "\u001b[33m"
  static Blue = "\u001b[34m"
  static Magenta = "\u001b[35m"
  static Cyan = "\u001b[36m"
  static White = "\u001b[37m"
  static Reset = "\u001b[0m"
  static Bold = "\u001b[1m"
  static Underline = "\u001b[4m"
  static Reversed = "\u001b[7m"
  static Up(n?: number): string {
    if (n === undefined) {
      return "\u001b[A";
    }
    return `\u001b[${n}A`;
  }
  static Down(n?: number): string {
    if (n === undefined) {
      return "\u001b[B";
    }
    return `\u001b[${n}B`;
  }
  static Right(n?: number): string {
    if (n === undefined) {
      return "\u001b[C";
    }
    return `\u001b[${n}C`;
  }
  static Left(n?: number): string {
    if (n === undefined) {
      return "\u001b[D";
    }
    return `\u001b[${n}D`;
  }
  static SetColumn(n: number): string {
    return `\u001b[${n}G`;
  }
  static SetPosition(n: number, m: number) {
    return `\u001b[${n};${m}H`;
  }
  // n=0 clears from cursor until end of screen, n=1 clears from cursor to beginning of screen, n=2 clears entire screen
  static ClearScreen(n: number) {
    return `\u001b[${n}J`;
  }
  // n=0 clears from cursor to end of line, n=1 clears from cursor to start of line, n=2 clears entire line
  static ClearLine(n: number) {
    return `\u001b[${n}K`;
  }
}

export default TerminalCodes;