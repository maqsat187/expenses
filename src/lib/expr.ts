// Small safe arithmetic evaluator for the "Сумма" field, so it can be typed
// like a spreadsheet cell (e.g. "=1200+850-300"). No eval()/Function() —
// everything runs through an explicit tokenizer + recursive-descent parser
// over a fixed grammar (numbers, + - * /, parentheses, unary minus).

type Token =
  | { type: "num"; value: number }
  | { type: "op"; value: "+" | "-" | "*" | "/" | "(" | ")" };

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === " " || ch === "\t") {
      i++;
      continue;
    }
    if ("+-*/()".includes(ch)) {
      tokens.push({ type: "op", value: ch as "+" | "-" | "*" | "/" | "(" | ")" });
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i + 1;
      while (j < input.length && /[0-9.]/.test(input[j])) j++;
      const value = Number(input.slice(i, j));
      if (!Number.isFinite(value)) return null;
      tokens.push({ type: "num", value });
      i = j;
      continue;
    }
    return null; // unrecognized character
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  atEnd(): boolean {
    return this.pos >= this.tokens.length;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token | undefined {
    return this.tokens[this.pos++];
  }

  parseExpression(): number {
    let value = this.parseTerm();
    for (;;) {
      const tok = this.peek();
      if (tok?.type === "op" && (tok.value === "+" || tok.value === "-")) {
        this.next();
        const rhs = this.parseTerm();
        value = tok.value === "+" ? value + rhs : value - rhs;
      } else {
        break;
      }
    }
    return value;
  }

  private parseTerm(): number {
    let value = this.parseUnary();
    for (;;) {
      const tok = this.peek();
      if (tok?.type === "op" && (tok.value === "*" || tok.value === "/")) {
        this.next();
        const rhs = this.parseUnary();
        if (tok.value === "/" && rhs === 0) throw new Error("division by zero");
        value = tok.value === "*" ? value * rhs : value / rhs;
      } else {
        break;
      }
    }
    return value;
  }

  private parseUnary(): number {
    const tok = this.peek();
    if (tok?.type === "op" && (tok.value === "+" || tok.value === "-")) {
      this.next();
      const value = this.parseUnary();
      return tok.value === "-" ? -value : value;
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const tok = this.next();
    if (!tok) throw new Error("unexpected end of expression");
    if (tok.type === "num") return tok.value;
    if (tok.type === "op" && tok.value === "(") {
      const value = this.parseExpression();
      const close = this.next();
      if (!close || close.type !== "op" || close.value !== ")") {
        throw new Error("expected closing parenthesis");
      }
      return value;
    }
    throw new Error("unexpected token");
  }
}

// Returns the computed value, or null if `input` isn't a valid expression.
export function evaluateExpression(input: string): number | null {
  const tokens = tokenize(input);
  if (!tokens || tokens.length === 0) return null;
  try {
    const parser = new Parser(tokens);
    const value = parser.parseExpression();
    if (!parser.atEnd() || !Number.isFinite(value)) return null;
    return value;
  } catch {
    return null;
  }
}
