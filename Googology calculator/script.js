// I use gemini to help me lmao

const PHI = (1 + Math.sqrt(5)) / 2;

// 1. Core Event Listener
document.getElementById('calcInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const input = this.value.trim();
    if (input) {
      processGoogology(input);
    }
  }
});

// 2. Main Processing Pipeline
function processGoogology(rawInput) {
  const display = document.getElementById('outputDisplay');
  if (!display) return;
  
  // Clean up and normalize input text string
  let expr = rawInput.toLowerCase().replace(/x/g, '*').replace(/\s+/g, '');
  expr = expr.replace(/phi/g, `(${PHI})`);
  
  // Hardcoded Googology Landmarks
  if (expr === 'googol') return renderMath(display, `10^{100}`); 
  if (expr === 'googolplex') return renderMath(display, `10^{10^{100}}`); 

  try {
    // Pass to our secure break_eternity evaluation chain
    let result = parseAddSub(expr);
    
    // Render clean LaTeX output
    renderMath(display, formatDecimalToLatex(result));
  } catch (err) {
    renderMath(display, `\\text{Error: Could not compute.}`);
  }
}

// 3. Mathematical Parser Chain (Right-Associative & Safe)
function findSplit(s, opArray, rightAssociative = false) {
  let depth = 0;
  if (rightAssociative) {
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') depth--;
      else if (depth === 0) {
        for (let op of opArray) {
          if (s.substring(i, i + op.length) === op) return { index: i, op: op };
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
    let left = parseFactorial(s.substring(0, split.index));
    let right = parseTetration(s.substring(split.index + 2));
    // break_eternity requires height parameter to be a regular JS float number
    return left.tetrate(right.toNumber());
  }
  return parseFactorial(s);
}

function parseFactorial(s) {
  s = s.trim();
  if (s.endsWith('!')) {
    let inner = s.slice(0, -1);
    let val = parseFactorial(inner);
    if (val.lt(0)) return new Decimal(NaN);
    
    if (val.lt(21) && val.eq(val.round())) {
      let res = new Decimal(1);
      for (let i = 2; i <= val.toNumber(); i++) res = res.mul(i);
      return res;
    } else {
      // High-precision Stirling's Approximation using native Decimals
      let n = val;
      let lnFact = n.mul(n.ln()).sub(n).add(n.mul(2 * Math.PI).ln().mul(0.5));
      return Decimal.pow(Math.E, lnFact);
    }
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

// 4. Clean, Unified LaTeX Formatter
function formatDecimalToLatex(d) {
  if (d.isNaN()) return "\\text{NaN}";
  if (!d.isFinite()) return "\\infty";

  // Layer 0: Flat numbers and standard scientific values
  if (d.layer === 0) {
    if (d.mag < 100000) {
      return String(Math.round(d.mag * 10000) / 10000);
    }
    let exp = Math.floor(Math.log10(d.mag));
    let mantissa = d.mag / Math.pow(10, exp);
    if (mantissa.toFixed(4) === "10.0000") { mantissa = 1; exp += 1; }
    if (mantissa.toFixed(4) === "1.0000") return `10^{${exp}}`;
    return `${mantissa.toFixed(4)} \\times 10^{${exp}}`;
  }

  // Layer 1: Single exponential tower (10^x)
  if (d.layer === 1) {
    let exp = d.mag;
    if (exp < 100000) {
      return `10^{${exp.toFixed(4).replace(/\.?0+$/, "")}}`;
    }
    return `10^{${formatDecimalToLatex(new Decimal(exp))}}`;
  }

  // Layer 2: Double exponential tower (10^10^x)
  if (d.layer === 2) {
    let exp = d.mag;
    if (exp < 100000) {
      return `10^{10^{${exp.toFixed(4).replace(/\.?0+$/, "")}}}`;
    }
    return `10^{10^{${formatDecimalToLatex(new Decimal(exp))}}}`;
  }

  // Layer 3+: Auto-format to Up-Arrow Notation
  return `10 \\uparrow\\uparrow ${d.layer}`;
}

function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  if (window.MathJax) {
    MathJax.typesetPromise([element]).catch((err) => console.log(err));
  }
}