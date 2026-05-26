function processGoogology(rawInput) {
  const display = document.getElementById('outputDisplay');
  
  let expr = rawInput.toLowerCase().replace(/x/g, '*').replace(/\s+/g, '');
  expr = expr.replace(/phi/g, `(${PHI})`);
  
  if (expr === 'googol') { 
    return renderMath(display, `\\text{Result: } 1 \\times 10^{100}`); 
  }
  if (expr === 'googolplex') { 
    return renderMath(display, `\\text{Result: } 1 \\times 10^{10^{100}}`); 
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
          formatWithThreshold(display, result);
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
        
        formatWithThreshold(display, null, logFact);
        return;
      }
    } catch(err) {
      renderMath(display, `\\text{Error: Invalid factorial input.}`);
      return;
    }
  }

  // 2. CASCADING POWER TOWER ENGINE
  if (expr.includes('^')) {
    const parts = expr.split('^');
    
    try {
      // We will track the final value purely in a base-10 log format from the start
      // currentLog holds the value of log10(current_accumulated_value)
      let currentLog = null; 
      
      // Evaluate right-to-left
      for (let i = parts.length - 1; i >= 0; i--) {
        let baseStr = parts[i];
        let coeffOuter = 1;
        
        // Handle a front multiplier on the very first term (e.g., 6*2^3^4)
        if (i === 0 && baseStr.includes('*')) {
          const multParts = baseStr.split('*');
          coeffOuter = Function(`"use strict"; return (${multParts[0]})`)();
          baseStr = multParts[1];
        }
        
        let base = Function(`"use strict"; return (${baseStr})`)();
        
        if (currentLog === null) {
          // First step: This is just the absolute top of the tower (e.g., the "5" in 4^5)
          currentLog = Math.log10(base);
        } else {
          // Cascading step:
          // If the previous layer evaluation was X, the new layer is base^X
          // Thus, the new log10 value is: log10(base^X) = X * log10(base)
          // Since X is tracked as 10^currentLog, the new log10 becomes:
          // log10(new) = 10^currentLog * log10(base)
          
          let nextLogOfBase = Math.log10(base);
          
          // To prevent standard JS floating overflow during multiplication:
          // log10(10^currentLog * nextLogOfBase) = currentLog + log10(nextLogOfBase)
          let advancedLog = currentLog + Math.log10(nextLogOfBase);
          
          // Apply front coefficients if processing the very last base item
          if (i === 0 && coeffOuter !== 1) {
            // log10(coeff * 10^advancedLog)
            formatWithThreshold(display, null, advancedLog, coeffOuter);
            return;
          }
          
          currentLog = advancedLog;
        }
      }
      
      formatWithThreshold(display, null, currentLog);
      return;
      
    } catch (err) {
      // Fall through if parsing fails
    }
  }

  // 3. STANDARD NATIVE ENGINE (Fallback for basic math expressions)
  let jsExpr = expr.replace(/\^/g, '**');
  try {
    let result = Function(`"use strict"; return (${jsExpr})`)();
    if (Number.isFinite(result)) {
      formatWithThreshold(display, result);
      return;
    }
  } catch (e) {}

  renderMath(display, `\\text{Error: Could not compute.}`);
}

// Updated helper handles multiplier offsets cleanly over massive logs
function formatWithThreshold(display, value, log10Value = null, outerMultiplier = 1) {
  let logVal = log10Value !== null ? log10Value : Math.log10(Math.abs(value));
  
  if (value !== null && Number.isFinite(value) && Math.abs(value) < 10000000000) {
    let outputStr = Number(value.toFixed(10)).toString();
    renderMath(display, `\\text{Result: } ${outputStr}`);
  } else {
    // Incorporate outer multiplier into log mapping if it exists
    if (outerMultiplier !== 1) {
      logVal += Math.log10(outerMultiplier);
    }
    
    let expOut = Math.floor(logVal);
    let coeffOut = Math.pow(10, logVal - expOut);
    
    if (expOut.toString().includes('e')) {
      let eNotation = expOut.toExponential(4);
      let parts = eNotation.split('e');
      let innerCoeff = parts[0];
      let innerExp = parts[1].replace('+', '');
      renderMath(display, `\\text{Result: } ${coeffOut.toFixed(4)} \\times 10^{${innerCoeff} \\times 10^{${innerExp}}}`);
    } else {
      renderMath(display, `\\text{Result: } ${coeffOut.toFixed(4)} \\times 10^{${expOut}}`);
    }
  }
}