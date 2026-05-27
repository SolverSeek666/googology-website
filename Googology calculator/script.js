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

// RECURSIVE EXPONENT COMPRESSOR (Eliminates the giant walls of zeros!)
function formatValueClean(v) {
  if (v < 1e10) {
    return Math.floor(v).toString();
  }
  let log = Math.log10(v);
  let exp = Math.floor(log);
  let coeff = Math.pow(10, log - exp);
  
  // Guard against floating-point rounding errors (e.g., 9.9999 rounding up)
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

// THE UNIFIED TOWER FORMATTER
function formatTower(display, current) {
  if (current.height === 0) {
    if (current.value < 10000000000) {
      let outputStr = Number(current.value.toFixed(10)).toString();
      renderMath(display, `\\text{Result: } ${outputStr}`);
    } else {
      renderHeight1(display, Math.log10(current.value));
    }
  } else if (current.height === 1) {
    renderHeight1(display, current.value);
  } else {
    // Height 2+ Towers (e.g., 10^10^20, 10^10^10^20, 2^3^4^5)
    let exp = Math.floor(current.value);
    let coeff = Math.pow(10, current.value - exp);
    
    if (coeff.toFixed(4) === "10.0000") {
      coeff = 1;
      exp += 1;
    }
    
    let coeffStr = coeff.toFixed(4);
    let latex = "";
    
    if (coeffStr === "1.0000") {
      latex = formatValueClean(exp);
    } else {
      latex = `${coeffStr} \\times 10^{${formatValueClean(exp)}}`;
    }
    
    // Nest the tower base powers iteratively
    for (let h = 0; h < current.height; h++) {
      latex = `10^{${latex}}`;
    }
    renderMath(display, `\\text{Result: } ${latex}`);
  }
}

// Helper for single-layer scientific formatting
function renderHeight1(display, logVal) {
  let exp = Math.floor(logVal);
  let coeff = Math.pow(10, logVal - exp);
  
  if (coeff.toFixed(4) === "10.0000") {
    coeff = 1;
    exp += 1;
  }
  
  let coeffStr = coeff.toFixed(4);
  if (coeffStr === "1.0000") {
    renderMath(display, `\\text{Result: } 10^{${formatValueClean(exp)}}`);
  } else {
    renderMath(display, `\\text{Result: } ${coeffStr} \\times 10^{${formatValueClean(exp)}}`);
  }
}

function processGoogology(rawInput) {
  const display = document.getElementById('outputDisplay');
  
  let expr = rawInput.toLowerCase().replace(/x/g, '*').replace(/\s+/g, '');
  expr = expr.replace(/phi/g, `(${PHI})`);
  
  if (expr === 'googol') { 
    return renderMath(display, `\\text{Result: } 10^{100}`); 
  }
  if (expr === 'googolplex') { 
    return renderMath(display, `\\text{Result: } 10^{10^{100}}`); 
  }

  // 1. FACTORIAL ENGINE
  if (expr.endsWith('!')) {
    let numStr = expr.slice(0, -1);
    try {
      let jsNumExpr = numStr.replace(/\^/g, '**');
      let x = Function(`"use strict"; return (${jsNumExpr})`)();
      
      if (!isNaN(x) && x > -1) {
        if (Number.isInteger(x) && x <= 20) {
          let result = 1;
          for (let i = 2; i <= x; i++) result *= i;
          formatTower(display, { value: result, height: 0 });
          return;
        } 
        
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
    } catch(err) {
      renderMath(display, `\\text{Error: Invalid factorial input.}`);
      return;
    }
  }

  // 2. STRUCTURAL POWER TOWER ENGINE
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
      
      formatTower(display, current);
      return;
      
    } catch (err) {
      // Fall through if parsing fails
    }
  }

  // 3. STANDARD NATIVE ENGINE
  let jsExpr = expr.replace(/\^/g, '**');
  try {
    let result = Function(`"use strict"; return (${jsExpr})`)();
    if (Number.isFinite(result)) {
      formatTower(display, { value: result, height: 0 });
      return;
    }
  } catch (e) {}

  renderMath(display, `\\text{Error: Could not compute.}`);
}

// MathJax Renderer
function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  MathJax.typesetPromise([element]).catch((err) => console.log(err));
}