const PHI = (1 + Math.sqrt(5)) / 2;

document.getElementById('calcInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const input = this.value.trim();
    if (input) {
      processGoogology(input);
    }
  }
});

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
  } else if (current.height === 2) {
    let exp = Math.floor(current.value);
    let coeff = Math.pow(10, current.value - exp);
    let coeffStr = coeff.toFixed(4);
    
    // BUG FIX: Drop 1.0000 multiplier from height 2 towers
    if (coeffStr === "1.0000") {
      renderMath(display, `\\text{Result: } 10^{10^{${exp}}}`);
    } else {
      renderMath(display, `\\text{Result: } 10^{${coeffStr} \\times 10^{${exp}}}`);
    }
  } else {
    // Height 3+ Towers
    let exp = Math.floor(current.value);
    let coeff = Math.pow(10, current.value - exp);
    let coeffStr = coeff.toFixed(4);
    
    let topStr = (coeffStr === "1.0000") ? `10^{${exp}}` : `${coeffStr} \\times 10^{${exp}}`;
    let latex = topStr;
    
    for (let h = 0; h < current.height - 1; h++) {
      latex = `10^{${latex}}`;
    }
    renderMath(display, `\\text{Result: } ${latex}`);
  }
}

// Helper for standard 10^n scientific calculations
function renderHeight1(display, logVal) {
  let exp = Math.floor(logVal);
  let coeff = Math.pow(10, logVal - exp);
  let coeffStr = coeff.toFixed(4);
  
  // If the exponent itself is massive enough to use JS scientific notation
  if (exp.toString().includes('e')) {
    let eNotation = exp.toExponential(4);
    let parts = eNotation.split('e');
    let innerCoeff = parseFloat(parts[0]).toFixed(4);
    let innerExp = parts[1].replace('+', '');
    
    let expStr = (innerCoeff === "1.0000") ? `10^{${innerExp}}` : `${innerCoeff} \\times 10^{${innerExp}}`;
    
    if (coeffStr === "1.0000") {
      renderMath(display, `\\text{Result: } 10^{${expStr}}`);
    } else {
      renderMath(display, `\\text{Result: } ${coeffStr} \\times 10^{${expStr}}`);
    }
  } else {
    // BUG FIX: Drop 1.0000 multiplier from standard logs
    if (coeffStr === "1.0000") {
      renderMath(display, `\\text{Result: } 10^{${exp}}`);
    } else {
      renderMath(display, `\\text{Result: } ${coeffStr} \\times 10^{${exp}}`);
    }
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
        } else if (current.height === 1) {
          current.value = Math.log10(Math.log10(b)) + current.value;
          current.height = 2;
        } else {
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

function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  MathJax.typesetPromise([element]).catch((err) => console.log(err));
}