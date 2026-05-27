// I use gemini to help me lmao

const PHI = (1 + Math.sqrt(5)) / 2;

// 1. Safe Initialization Hook (Prevents null script crashes on load)
function initCalculator() {
  const inputEl = document.getElementById('calcInput');
  if (!inputEl) return;

  inputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const input = this.value.trim();
      if (input) {
        processGoogology(input);
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalculator);
} else {
  initCalculator();
}

// 2. Core Processing Pipeline
function processGoogology(rawInput) {
  const display = document.getElementById('outputDisplay');
  if (!display) return;
  
  let expr = rawInput.toLowerCase().replace(/x/g, '*').replace(/\s+/g, '');
  expr = expr.replace(/phi/g, `(${PHI})`);
  
  if (expr === 'googol') return renderMath(display, `10^{100}`); 
  if (expr === 'googolplex') return renderMath(display, `10^{10^{100}}`); 

  try {
    let result = parseAddSub(expr);
    renderMath(display, formatDecimalToLatex(result));
  } catch (err) {
    renderMath(display, `\\text{Error: Could not compute.}`);
  }
}

// 3. Recursive Binary Splitter
function findSplit(s, opArray, rightAssociative = false) {
  let depth = 0;
  if (rightAssociative) {
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') depth--;
      else if (depth === 0) {
        for (let op of opArray) {
          if (s.substring(i, i + op.length) === op) {
            // CRITICAL FIX: Ignore single '^' matches if they are actually sitting inside a '^^'
            if (op === '^' && (s[i + 1] === '^' || (i > 0 && s[i - 1] === '^'))) {
              continue;
            }
            return { index: i, op: op };
          }
        }
      }
    }
  } else {
    for (let i = s.length - 1; i >= 0; i--) {
      if (s[i] === ')') depth++;
      else if (s[i] === '(') depth--;
      else if (depth === 0) {
        for (let op of opArray) {
          if (i - op.length + 1 >= 0 && s.substring(i - op.length + 1, i + 1) === op) {
            return { index: i - op.length + 1, op: op };
          }
        }
      }
    }
  }
  return null;
}

function parseAddSub(s) {
  let split = findSplit(s, ['+', '-'], false);
  if (split) {
    let left = parseAddSub(s.substring(0, split.index));
    let right = parseMulDiv(s.substring(split.index + split.op.length));
    return split.op === '+' ? left.add(right) : left.sub(right);
  }
  return parseMulDiv(s);
}

function parseMulDiv(s) {
  let split = findSplit(s, ['*', '/'], false);
  if (split) {
    let left = parseMulDiv(s.substring(0, split.index));
    let right = parseExponent(s.substring(split.index + split.op.length));
    return split.op === '*' ? left.mul(right) : left.div(right);
  }
  return parseExponent(s);
}

function parseExponent(s) {
  let split = findSplit(s, ['^'], true);
  if (split) {
    let left = parseTetration(s.substring(0, split.index));
    let right = parseExponent(s.substring(split.index + 1));
    return left.pow(right);
  }
  return parseTetration(s);
}

function parseTetration(s) {
  let split = findSplit(s, ['^^'], true);
  if (split) {
    let left = parsePrimary(s.substring(0, split.index));
    let right = parseTetration(s.substring(split.index + 2));
    return left.tetrate(right.toNumber());
  }
  return parsePrimary(s);
}

function parsePrimary(s) {
  s = s.trim();
  if (s.startsWith('(') && s.endsWith(')')) {
    return parseAddSub(s.substring(1, s.length - 1));
  }
  let d = new Decimal(s);
  if (d.isNaN()) throw new Error("Invalid Input");
  return d;
}

// 4. Responsive LaTeX Layout Engine
function formatDecimalToLatex(d) {
  if (d.isNaN()) return "\\text{NaN}";
  if (!d.isFinite()) return "\\infty";

  if (d.layer === 0) {
    if (d.mag < 100000) {
      return String(parseFloat(d.mag.toFixed(4)));
    }
    let exp = Math.floor(Math.log10(d.mag));
    let mantissa = d.mag / Math.pow(10, exp);
    if (mantissa.toFixed(4) === "10.0000") { mantissa = 1; exp += 1; }
    if (mantissa.toFixed(4) === "1.0000") return `10^{${exp}}`;
    return `${mantissa.toFixed(4).replace(/\.?0+$/, "")} \\times 10^{${exp}}`;
  }

  if (d.layer === 1) {
    let exp = d.mag;
    if (exp < 100000) {
      return `10^{${parseFloat(exp.toFixed(4))}}`;
    }
    return `10^{${formatDecimalToLatex(new Decimal(exp))}}`;
  }

  if (d.layer === 2) {
    let exp = d.mag;
    if (exp < 100000) {
      return `10^{10^{${parseFloat(exp.toFixed(4))}}}`;
    }
    return `10^{10^{${formatDecimalToLatex(new Decimal(exp))}}}`;
  }

  return `10 \\uparrow\\uparrow ${parseFloat((d.layer + Math.log10(d.mag)).toFixed(4))}`;
}

function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  if (window.MathJax) {
    MathJax.typesetPromise([element]).catch((err) => console.log(err));
  }
}