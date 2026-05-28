// I use gemini to help me lmao

// ============================================================================
// SECTION 1: SETUP & INPUT
// ============================================================================

const PHI = (1 + Math.sqrt(5)) / 2;

// Listen for the "Enter" key in the input box to start the calculation
document.getElementById('calcInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const input = this.value.trim();
    if (input) {
      processGoogology(input);
    }
  }
});


// ============================================================================
// SECTION 2: THE MATH BRAIN
// Parses the user's input and routes it to the specialized engines.
// ============================================================================

function processGoogology(rawInput) {
  const display = document.getElementById('outputDisplay');
  
  // Clean up the input: convert to lowercase, swap 'x' for '*', remove spaces
  let expr = rawInput.toLowerCase().replace(/x/g, '*').replace(/\s+/g, '');
  expr = expr.replace(/phi/g, `(${PHI})`);
  
  // Handle hardcoded Easter eggs / specific words
  if (expr === 'googol') return renderMath(display, `\\text{Result: } 10^{100}`); 
  if (expr === 'googolplex') return renderMath(display, `\\text{Result: } 10^{10^{100}}`); 

  // --- ENGINE 1: TETRATION (^^) ---
  if (expr.includes('^^')) {
    try {
      const parts = expr.split('^^');
      let baseExpr = parts[0] === "" ? "10" : parts[0]; 
      let base = Function(`"use strict"; return (${baseExpr.replace(/\^/g, '**')})`)();
      
      let rest = parts[1];
      let y, barrier = 1;
      
      if (rest.includes('>')) {
        const subParts = rest.split('>');
        y = Function(`"use strict"; return (${subParts[0].replace(/\^/g, '**')})`)();
        barrier = Function(`"use strict"; return (${subParts[1].replace(/\^/g, '**')})`)();
      } else {
        y = Function(`"use strict"; return (${rest.replace(/\^/g, '**')})`)();
      }
      
      if (!isNaN(base) && !isNaN(y) && !isNaN(barrier)) {
        if (Math.abs(base - 10) < 1e-7) {
           formatTower(display, { value: barrier, height: y });
           return;
        }
        
        let iters = Math.min(y, 10);
        let current = { value: barrier, height: 0 };
        
        for (let i = 0; i < iters; i++) {
          if (current.height === 0) {
            let next = Math.pow(base, current.value);
            if (Number.isFinite(next) && next < 1e300) {
              current.value = next;
            } else {
              current.value = current.value * Math.log10(base);
              current.height = 1;
            }
          } else if (current.height === 1) {
            current.value = current.value + Math.log10(Math.log10(base));
            current.height = 2;
          } else {
             // Lock the value, just climb
            current.height += 1;
          }
        }
        
        if (y > 10) current.height += (y - 10);
        
        formatTower(display, current);
        return;
      }
    } catch (err) {
      return renderMath(display, `\\text{Error: Invalid tetration syntax.}`);
    }
  }

  // --- ENGINE 2: NESTED & MULTI-FACTORIALS (!) ---
  if (expr.includes('!')) {
    let factorialResult = parseFactorialExpression(expr);
    if (factorialResult && !isNaN(factorialResult.value)) {
      formatTower(display, factorialResult);
      return;
    }
  }

  // --- ENGINE 3: STRUCTURAL POWER TOWERS (^) ---
  if (expr.includes('^')) {
    const parts = expr.split('^');
    try {
      let current = { value: null, height: 0 };
      let topExpr = parts[parts.length - 1];
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
            if (i === 0 && coeffOuter !== 1) current.value += Math.log10(coeffOuter);
            current.height = 1;
          }
        } else if (current.height === 1) {
          current.value = current.value + Math.log10(Math.log10(b));
          current.height = 2;
        } else {
          // FIX: Once height >= 2, adding log10(log10(b)) to 10^V does nothing!
          // We lock the value and ONLY increase the tower height.
          current.height += 1;
        }
      }
      
      formatTower(display, current);
      return;
    } catch (err) { }
  }
  // --- ENGINE 4: STANDARD NATIVE MATH ---
  let jsExpr = expr.replace(/\^/g, '**');
  try {
    let result = Function(`"use strict"; return (${jsExpr})`)();
    if (Number.isFinite(result)) {
      formatTower(display, { value: result, height: 0 });
      return;
    }
  } catch (e) {}

  // Global Fallback Error
  renderMath(display, `\\text{Error: Could not compute.}`);
}


// ============================================================================
// SECTION 2.5: FACTORIAL CORE ENGINE HELPERS
// Recursively unwraps strings like ((10!)!) and computes multifactorials.
// ============================================================================

function parseFactorialExpression(s) {
  s = s.trim();
  
  // Count consecutive trailing exclamation marks (e.g., !! is step 2, !!! is step 3)
  let k = 0;
  while (s.endsWith('!')) {
    k++;
    s = s.slice(0, -1).trim();
  }
  
  // Remove wrapping parentheses if they surround the remaining expression
  if (s.startsWith('(') && s.endsWith(')')) {
    s = s.slice(1, -1).trim();
  }
  
  // If exclamation marks were processed, solve recursively
  if (k > 0) {
    let inner = parseFactorialExpression(s);
    if (!inner || isNaN(inner.value)) return null;
    
    // If the inner value is already a giant tower, an additional factorial
    // scales it up by another tower level layer.
    if (inner.height > 0) {
      return { value: inner.value, height: inner.height + 1 };
    }
    
    return solveMultifactorial(inner.value, k);
  }
  
  // Base case: No exclamation marks left, evaluate standard math block
  try {
    let jsExpr = s.replace(/\^/g, '**');
    let val = Function(`"use strict"; return (${jsExpr})`)();
    if (!isNaN(val) && Number.isFinite(val)) {
      return { value: val, height: 0 };
    }
  } catch (e) {}
  
  return null;
}

function solveMultifactorial(x, k) {
  if (x < 0 || isNaN(x)) return { value: NaN, height: 0 };
  x = Math.round(x);
  
  // Case A: Number is small enough to evaluate cleanly without hitting Infinity
  if (x <= 170) {
    let res = 1;
    for (let i = x; i > 0; i -= k) {
      res *= i;
    }
    if (Number.isFinite(res) && res < 1e300) {
      return { value: res, height: 0 };
    }
  }
  
  // Case B: Medium numbers (up to 500,000). Loop via log10 for perfect precision.
  if (x <= 500000) {
    let logSum = 0;
    for (let i = x; i > 0; i -= k) {
      logSum += Math.log10(i);
    }
    return { value: logSum, height: 1 };
  }
  
  // Case C: Gigantic numbers. Use Generalized Stirling Approximation to prevent browser lag.
  const log10e = Math.LOG10E;
  let part1 = (x / k) * (Math.log10(x) - log10e);
  let part2 = 0.5 * Math.log10(2 * Math.PI * x / k);
  return { value: part1 + part2, height: 1 };
}


// ============================================================================
// SECTION 3: DISPLAY FORMATTING ROUTER
// ============================================================================

function formatTower(display, current) {
  const toLatexSci = (num) => {
    let str = String(num);
    if (str.includes('e')) {
      let [coeff, exp] = str.split('e');
      exp = exp.replace('+', ''); 
      if (coeff === '1') return `10^{${exp}}`;
      return `${coeff} \\times 10^{${exp}}`;
    }
    return typeof formatValueClean === 'function' ? formatValueClean(num) : str;
  };

  if (current.height >= 6) {
    let a = current.height;
    let b = current.value;
    
    if (Math.abs(b - 10) < 1e-4 || b.toFixed(4) === "10.0000") {
      a += 1;
      b = 1;
    }
    
    let heightStr = toLatexSci(a);
    
    if (Math.abs(b - 1) < 1e-4 || b.toFixed(4) === "1.0000") {
      renderMath(display, `10 \\uparrow\\uparrow {${heightStr}}`);
    } else {
      let bStr = b < 1e10 ? Number(b.toFixed(4)).toString() : toLatexSci(b);
      renderMath(display, `10 \\uparrow\\uparrow {${heightStr}} > ${bStr}`);
    }
    return;
  }

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
    let latex = coeffStr === "1.0000" ? toLatexSci(exp) : `${coeffStr} \\times 10^{${toLatexSci(exp)}}`;
    
    // FIX: Loop height - 1 times, because the 'latex' string already absorbed the first base-10!
    for (let h = 0; h < current.height - 1; h++) {
      latex = `10^{${latex}}`;
    }
    renderMath(display, `${latex}`);
  }
}

function formatValueClean(v) {
  if (v < 1e10) return Math.floor(v).toString();
  let log = Math.log10(v);
  let exp = Math.floor(log);
  let coeff = Math.pow(10, log - exp);
  
  if (coeff.toFixed(4) === "10.0000") {
    coeff = 1;
    exp += 1;
  }
  
  let coeffStr = coeff.toFixed(4);
  if (coeffStr === "1.0000") return `10^{${formatValueClean(exp)}}`;
  return `${coeffStr} \\times 10^{${formatValueClean(exp)}}`;
}

function renderHeight1(display, val) {
  const toLatexSci = (num) => {
    let str = String(num);
    if (str.includes('e')) {
      let [coeff, exp] = str.split('e');
      exp = exp.replace('+', '');
      if (coeff === '1') return `10^{${exp}}`;
      return `${coeff} \\times 10^{${exp}}`;
    }
    return typeof formatValueClean === 'function' ? formatValueClean(num) : str;
  };

  let exp = Math.floor(val);
  let coeff = Math.pow(10, val - exp);
  
  if (coeff.toFixed(4) === "10.0000") {
    coeff = 1;
    exp += 1;
  }
  
  let coeffStr = coeff.toFixed(4);
  let latex = coeffStr === "1.0000" ? `10^{${toLatexSci(exp)}}` : `${coeffStr} \\times 10^{${toLatexSci(exp)}}`;
  renderMath(display, latex);
}


// ============================================================================
// SECTION 4: THE OUTPUT RENDERING
// ============================================================================

function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  MathJax.typesetPromise([element]).catch((err) => console.log(err));
}
