// I use gemini to help me lmao

const PHI = (1 + Math.sqrt(5)) / 2;

document.getElementById('calcInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const input = this.value.trim();
    if (input) {
      processGoogology(input);
    }
  }
});

function formatValueClean(v) {
  if (v < 1e10) {
    return Math.floor(v).toString();
  }
  let log = Math.log10(v);
  let exp = Math.floor(log);
  let coeff = Math.pow(10, log - exp);
  
  if (coeff.toFixed(4) === "10.0000") {
    coeff = 1;
    exp += 1;
  }
  
  let coeffStr = coeff.toFixed(4);
  if (coeffStr === "1.0000") {
    return `10^{${formatValueClean(exp)}}`;
  }
  return `${coeffStr} \\times 10^{${formatValueClean(exp)}}`;
}

// Parses any expression or sub-expression structurally using logs
function parseToStructural(rawStr) {
  let expr = rawStr.trim().toLowerCase().replace(/\s+/g, '').replace(/x/g, '*');
  
  if (!expr.includes('^')) {
    if (expr.includes('e')) {
      let [c, e] = expr.split('e');
      let coeff = parseFloat(c);
      let exp = parseFloat(e);
      return { value: exp + Math.log10(coeff), height: 1, latex: `${c} \\times 10^{${e}}` };
    }
    let val = Function(`"use strict"; return (${expr})`)();
    if (Number.isFinite(val)) {
      return { value: val, height: 0, latex: String(val) };
    }
    return { value: Infinity, height: 0, latex: "\\infty" };
  }

  const parts = expr.split('^');
  let current = { value: null, height: 0 };
  let topExpr = parts[parts.length - 1].replace(/\*\*/g, '^');
  current.value = Function(`"use strict"; return (${topExpr})`)();
  
  for (let i = parts.length - 2; i >= 0; i--) {
    let baseStr = parts[i];
    let coeffOuter = 1;
    
    if (i === 0 && baseStr.includes('*')) {
      const multParts = baseStr.split('*');
      coeffOuter = Function(`"use strict"; return (${multParts[0]})`)();
      baseStr = multParts[1];
    }
    
    let b = Function(`"use strict"; return (${baseStr})`)();
    
    if (current.height === 0) {
      let next = Math.pow(b, current.value);
      if (Number.isFinite(next) && next < 1e300) {
        current.value = next * coeffOuter;
      } else {
        current.value = current.value * Math.log10(b);
        if (i === 0 && coeffOuter !== 1) {
          current.value += Math.log10(coeffOuter);
        }
        current.height = 1;
      }
    } else {
      current.value = Math.log10(Math.log10(b)) + current.value;
      current.height += 1;
    }
  }
  
  let latex = "";
  if (current.height === 0) {
    latex = String(current.value);
  } else if (current.height === 1) {
    let exp = Math.floor(current.value);
    let coeff = Math.pow(10, current.value - exp);
    if (Math.abs(coeff - 10) < 1e-4) { coeff = 1; exp += 1; }
    if (Math.abs(coeff - 1) < 1e-4) {
      latex = `10^{${exp}}`;
    } else {
      latex = `${Number(coeff.toFixed(4))} \\times 10^{${exp}}`;
    }
  } else {
    let exp = Math.floor(current.value);
    let coeff = Math.pow(10, current.value - exp);
    if (Math.abs(coeff - 10) < 1e-4) { coeff = 1; exp += 1; }
    latex = (Math.abs(coeff - 1) < 1e-4) ? `${exp}` : `${Number(coeff.toFixed(4))} \\times 10^{${exp}}`;
    for (let h = 0; h < current.height; h++) {
      latex = `10^{${latex}}`;
    }
  }
  
  return { value: current.value, height: current.height, latex: latex };
}

function formatTower(display, data) {
  const toLatexSci = (num) => {
    if (num === Infinity || num === "Infinity") return "\\infty";
    let str = String(num);
    if (str.includes('e')) {
      let [coeff, exp] = str.split('e');
      exp = exp.replace('+', '');
      let cNum = parseFloat(coeff);
      if (Math.abs(cNum - 1) < 1e-10) return `10^{${exp}}`;
      let roundedCoeff = Number(cNum.toFixed(4));
      if (roundedCoeff === 1) return `10^{${exp}}`;
      return `${roundedCoeff} \\times 10^{${exp}}`;
    }
    let n = Number(num);
    if (!isNaN(n) && Math.abs(n - Math.round(n)) < 1e-10) return String(Math.round(n));
    return typeof formatValueClean === 'function' ? formatValueClean(num) : str;
  };

  let current = data; 
  let isTetration = current.forceTetration || (current.height !== undefined && current.height >= 6);

  // 1. TETRATION RENDERING PATH
  if (isTetration) {
    let heightStr = current.forceTetration ? current.tetraHeightStr : toLatexSci(current.height);
    let b = current.value;
    
    if (Math.abs(b - 1) < 1e-4 || b.toFixed(4) === "1.0000") {
      renderMath(display, `10 \\uparrow\\uparrow {${heightStr}}`);
    } else {
      let bStr = b < 1e10 ? Number(b.toFixed(4)).toString() : toLatexSci(b);
      if (bStr === "1" || bStr.includes("1.0000")) {
        renderMath(display, `10 \\uparrow\\uparrow {${heightStr}}`);
      } else {
        renderMath(display, `10 \\uparrow\\uparrow {${heightStr}} > ${bStr}`);
      }
    }
    return;
  }

  // 2. STANDARD POWER TOWERS PATH
  if (current.height === 0) {
    if (current.value < 10000000000) {
      let outputStr = Number(current.value.toFixed(10)).toString();
      renderMath(display, `${outputStr}`);
    } else {
      renderHeight1(display, Math.log10(current.value));
    }
  } else if (current.height === 1) {
    renderHeight1(display, current.value);
  } else {
    let exp = Math.floor(current.value);
    let coeff = Math.pow(10, current.value - exp);
    
    if (coeff.toFixed(4) === "10.0000") {
      coeff = 1;
      exp += 1;
    }
    
    let coeffStr = coeff.toFixed(4);
    let latex = "";
    
    if (coeffStr === "1.0000") {
      if (exp === 1) {
         latex = "10";
         for (let h = 1; h < current.height; h++) {
            latex = `10^{${latex}}`;
         }
      } else {
         latex = toLatexSci(exp);
         for (let h = 0; h < current.height; h++) {
            latex = `10^{${latex}}`;
         }
      }
    } else {
      latex = `${coeffStr} \\times 10^{${toLatexSci(exp)}}`;
      for (let h = 0; h < current.height; h++) {
        latex = `10^{${latex}}`;
      }
    }
    renderMath(display, `${latex}`);
  }
}

function renderHeight1(display, logVal) {
  let exp = Math.floor(logVal);
  let coeff = Math.pow(10, logVal - exp);
  if (coeff.toFixed(4) === "10.0000") { coeff = 1; exp += 1; }
  let coeffStr = coeff.toFixed(4);
  if (coeffStr === "1.0000") {
    renderMath(display, `10^{${typeof formatValueClean === 'function' ? formatValueClean(exp) : exp}}`);
  } else {
    renderMath(display, `${coeffStr} \\times 10^{${typeof formatValueClean === 'function' ? formatValueClean(exp) : exp}}`);
  }
}

// --- Upgraded Tetration Engine ---

class Tower {
  constructor(value, height = 0) {
    this.value = value;
    this.height = height;
    this.isHugeTetration = false;
    this.base = 10;
    this.y = null;
  }

  normalize() {
    if (this.isHugeTetration) return this;
    while (true) {
      if (this.height === 0) {
        if (this.value >= 1e300) {
          this.value = Math.log10(this.value);
          this.height = 1;
          continue;
        }
      } else {
        if (this.value >= 1e300) {
          this.value = Math.log10(this.value);
          this.height += 1;
          continue;
        }
        if (this.value < 300 && this.height === 1) {
          this.value = Math.pow(10, this.value);
          this.height = 0;
          continue;
        }
      }
      break;
    }
    return this;
  }
}

function formatValueClean(val) {
  if (val === 0) return "0";
  if (!isFinite(val)) return "\\infty";
  if (val >= 1e6 || val < 1e-4) {
    let exp = Math.floor(Math.log10(val));
    let coeff = val / Math.pow(10, exp);
    if (coeff.toFixed(4) === "10.0000") { coeff = 1; exp += 1; }
    return `${coeff.toFixed(4)} \\times 10^{${exp}}`;
  }
  return val.toFixed(4).replace(/\.?0+$/, "");
}

function towerPow(b, T) {
  T.normalize();
  if (T.height === 0) {
    let val = Math.pow(b, T.value);
    if (val < 1e300) {
      return new Tower(val, 0).normalize();
    } else {
      return new Tower(T.value * Math.log10(b), 1).normalize();
    }
  } else if (T.height === 1) {
    let log10_b = Math.log10(b);
    let inner = T.value + Math.log10(log10_b);
    return new Tower(inner, 2).normalize();
  } else {
    // For towers of height >= 2, changing the base at the bottom 
    // is microscopic at the top level. It simply adds 1 to the tower height.
    return new Tower(T.value, T.height + 1).normalize();
  }
}

function towerTetrate(b, yTower, barrier = 1) {
  yTower.normalize();
  // If the height parameter itself is too huge to expand sequentially
  if (yTower.isHugeTetration || yTower.height > 0 || yTower.value > 30) {
    let res = new Tower(0, 0);
    res.isHugeTetration = true;
    res.base = b;
    res.y = yTower;
    return res;
  }

  let yVal = Math.floor(yTower.value);
  let remainder = yTower.value - yVal;
  let current = new Tower(barrier, 0);

  if (remainder > 0) {
    current = new Tower(Math.pow(b, remainder), 0);
  }

  for (let i = 0; i < yVal; i++) {
    current = towerPow(b, current);
  }

  return current;
}

function formatTowerToLatex(T) {
  T.normalize();
  if (T.isHugeTetration) {
    let yLatex = formatTowerToLatex(T.y);
    return `${T.base} \\uparrow\\uparrow {${yLatex}}`;
  }

  if (T.height === 0) {
    return formatValueClean(T.value);
  } else if (T.height === 1) {
    let logVal = T.value;
    let exp = Math.floor(logVal);
    let coeff = Math.pow(10, logVal - exp);
    if (coeff.toFixed(4) === "10.0000") { coeff = 1; exp += 1; }
    let coeffStr = coeff.toFixed(4);
    if (coeffStr === "1.0000") {
      return `10^{${formatValueClean(exp)}}`;
    } else {
      return `${coeffStr} \\times 10^{${formatValueClean(exp)}}`;
    }
  } else {
    let latex = formatValueClean(T.value);
    for (let h = 0; h < T.height; h++) {
      latex = `10^{${latex}}`;
    }
    return latex;
  }
}

// Master execution function for the UI
function processGoogology(expr) {
  let display = document.getElementById('display');
  
  // Standardize symbols
  expr = expr.replace(/\\uparrow\\uparrow/g, '^^');
  expr = expr.replace(/\\times/g, '*');
  expr = expr.replace(/[{}]/g, ''); 

  function findClosingBracket(s, start) {
    let depth = 1;
    for (let i = start + 1; i < s.length; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  // Right-associative Tetration Parser
  function parseTetration(s) {
    s = s.trim();
    if (!s) return new Tower(1, 0);

    let depth = 0;
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') depth--;
      else if (depth === 0 && s[i] === '^' && s[i+1] === '^') {
        let baseStr = s.substring(0, i);
        let rightStr = s.substring(i + 2);
        let baseTower = parseExponent(baseStr);
        let rightTower = parseTetration(rightStr);
        
        let b = baseTower.height === 0 ? baseTower.value : Math.pow(10, baseTower.value);
        return towerTetrate(b, rightTower);
      }
    }
    return parseExponent(s);
  }

  // Right-associative Exponent Parser
  function parseExponent(s) {
    s = s.trim();
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') depth--;
      else if (depth === 0 && s[i] === '^' && (i === s.length - 1 || s[i+1] !== '^') && (i === 0 || s[i-1] !== '^')) {
        let baseStr = s.substring(0, i);
        let rightStr = s.substring(i + 1);
        let baseTower = parsePrimary(baseStr);
        let rightTower = parseExponent(rightStr);

        if (baseTower.height === 0) {
          return towerPow(baseTower.value, rightTower);
        } else {
          return baseTower; // Base tower dominates scale
        }
      }
    }
    return parsePrimary(s);
  }

  // Primary Numbers & Parentheses Parser
  function parsePrimary(s) {
    s = s.trim();
    if (s.startsWith('(') && s.endsWith(')')) {
      let close = findClosingBracket(s, 0);
      if (close === s.length - 1) {
        return parseTetration(s.substring(1, s.length - 1));
      }
    }

    if (/^\d+(\.\d+)?e[+-]?\d+$/i.test(s) || /^\d+$/.test(s) || /^\d+\.\d+$/.test(s)) {
      return new Tower(parseFloat(s), 0).normalize();
    }

    let val = parseFloat(s);
    if (isNaN(val)) val = 1;
    return new Tower(val, 0).normalize();
  }

  try {
    let resultTower = parseTetration(expr);
    let latexResult = formatTowerToLatex(resultTower);
    renderMath(display, latexResult);
  } catch (err) {
    renderMath(display, "\\text{Error processing tetration}");
  }
}