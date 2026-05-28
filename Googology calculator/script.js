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
// Parses the user's input and calculates the base value and tower height.
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
      
      // Check if there is a barrier target (>)
      if (rest.includes('>')) {
        const subParts = rest.split('>');
        y = Function(`"use strict"; return (${subParts[0].replace(/\^/g, '**')})`)();
        barrier = Function(`"use strict"; return (${subParts[1].replace(/\^/g, '**')})`)();
      } else {
        y = Function(`"use strict"; return (${rest.replace(/\^/g, '**')})`)();
      }
      
      if (!isNaN(base) && !isNaN(y) && !isNaN(barrier)) {
        // Fast-track if the base is exactly 10
        if (Math.abs(base - 10) < 1e-7) {
           formatTower(display, { value: barrier, height: y });
           return;
        }
        
        // Calculate true power tower up to 10 layers deep
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
          } else {
            current.value = Math.log10(Math.log10(base)) + current.value;
            current.height += 1;
          }
        }
        
        // Tack on remaining height if we capped at 10 iterations
        if (y > 10) current.height += (y - 10);
        
        formatTower(display, current);
        return;
      }
    } catch (err) {
      return renderMath(display, `\\text{Error: Invalid tetration syntax.}`);
    }
  }

  // --- ENGINE 2: FACTORIALS (!) ---
  if (expr.endsWith('!')) {
    let numStr = expr.slice(0, -1);
    try {
      let jsNumExpr = numStr.replace(/\^/g, '**');
      let x = Function(`"use strict"; return (${jsNumExpr})`)();
      
      if (!isNaN(x) && x > -1) {
        // Simple factorial for small numbers
        if (Number.isInteger(x) && x <= 20) {
          let result = 1;
          for (let i = 2; i <= x; i++) result *= i;
          formatTower(display, { value: result, height: 0 });
          return;
        } 
        
        // Stirling's Approximation for massive factorials
        let logFact;
        if (x < 12) {
          let p = 1;
          while (x < 12) { x++; p *= x; }
          let logG = 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(x) - x + (1 / (12 * x)) - (1 / (360 * Math.pow(x, 3)));
          logFact = (logG - Math.log(p)) * Math.LOG10E;
        } else {
          let logG = 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(x) - x + (1 / (12 * x)) - (1 / (360 * Math.pow(x, 3)));
          logFact = logG * Math.LOG10E;
        }
        
        formatTower(display, { value: logFact, height: 1 });
        return;
      }
    } catch(err) { }
  }

  // --- ENGINE 3: STRUCTURAL POWER TOWERS (^) ---
  if (expr.includes('^')) {
    const parts = expr.split('^');
    try {
      let current = { value: null, height: 0 };
      let topExpr = parts[parts.length - 1];
      current.value = Function(`"use strict"; return (${topExpr})`)();
      
      // Work top-down through the exponents
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
        } else {
          current.value = Math.log10(Math.log10(b)) + current.value;
          current.height += 1;
        }
      }
      
      formatTower(display, current);
      return;
    } catch (err) { }
  }

  // --- ENGINE 4: STANDARD MATH (Fallback) ---
  let jsExpr = expr.replace(/\^/g, '**');
  try {
    let result = Function(`"use strict"; return (${jsExpr})`)();
    if (Number.isFinite(result)) {
      formatTower(display, { value: result, height: 0 });
      return;
    }
  } catch (e) {}

  // If all engines fail
  renderMath(display, `\\text{Error: Could not compute.}`);
}


// ============================================================================
// SECTION 3: DISPLAY FORMATTING ROUTER
// Takes the raw height and value, formats them, and passes them to output
// ============================================================================

function formatTower(display, current) {
  
  // Helper to force numbers into nice LaTeX scientific notation
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

  // 1. TETRATION DISPLAY (Height 6 or higher)
  if (current.height >= 6) {
    let a = current.height;
    let b = current.value;
    
    // Normalize target values near 10
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

  // 2. SMALL NUMBERS DISPLAY (Height 0)
  if (current.height === 0) {
    if (current.value < 10000000000) {
      let outputStr = Number(current.value.toFixed(10)).toString();
      renderMath(display, `${outputStr}`);
    } else {
      renderHeight1(display, Math.log10(current.value));
    }
  
  // 3. SINGLE TOWER DISPLAY (Height 1)
  } else if (current.height === 1) {
    renderHeight1(display, current.value);
  
  // 4. MEDIUM POWER TOWER DISPLAY (Heights 2 through 5)
  } else {
    let exp = Math.floor(current.value);
    let coeff = Math.pow(10, current.value - exp);
    
    if (coeff.toFixed(4) === "10.0000") {
      coeff = 1;
      exp += 1;
    }
    
    let coeffStr = coeff.toFixed(4);
    let latex = coeffStr === "1.0000" ? toLatexSci(exp) : `${coeffStr} \\times 10^{${toLatexSci(exp)}}`;
    
    // Stack the 10s based on the height
    for (let h = 0; h < current.height; h++) {
      latex = `10^{${latex}}`;
    }
    renderMath(display, `${latex}`);
  }
}

// Helper: Formats basic numbers cleanly
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

// Helper: Specific styling for height-1 numbers
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
// SECTION 4: THE OUTPUT
// Pushes the final string to the DOM and renders it visually
// ============================================================================

function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  MathJax.typesetPromise([element]).catch((err) => console.log(err));
}
