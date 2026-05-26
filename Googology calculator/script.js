const PHI = (1 + Math.sqrt(5)) / 2;

document.getElementById('calcInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const input = this.value.trim();
    if (input) {
      processGoogology(input);
    }
  }
});

// Helper function to force your 10^10 formatting rule consistently everywhere
function formatWithThreshold(display, value, log10Value = null) {
  let logVal = log10Value !== null ? log10Value : Math.log10(Math.abs(value));
  
  // If the value is finite and mathematically below 10^10, print raw decimal string
  if (value !== null && Number.isFinite(value) && Math.abs(value) < 10000000000) {
    let outputStr = Number(value.toFixed(10)).toString();
    renderMath(display, `\\text{Result: } ${outputStr}`);
  } else {
    // If it crosses 10^10, force into standard m * 10^n
    let expOut = Math.floor(logVal);
    let coeffOut = Math.pow(10, logVal - expOut);
    
    // If the exponent itself is massive enough to use JS scientific notation (e.g. 1e+44)
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

function processGoogology(rawInput) {
  const display = document.getElementById('outputDisplay');
  
  // Standard cleanups
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
        // Compute the precise integer loop up to 20 to preserve precision
        if (Number.isInteger(x) && x <= 20) {
          let result = 1;
          for (let i = 2; i <= x; i++) result *= i;
          // Pipe it through our formatter check so it gets caught if it's > 10^10!
          formatWithThreshold(display, result);
          return;
        } 
        
        // Continuous Gamma Curve approximation for larger factorials
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

  // 2. CASCADING POWER TOWER & LOG ENGINE
  if (expr.includes('^')) {
    const parts = expr.split('^');
    
    try {
      // Evaluate components from right to left (standard mathematical tower order)
      // Example: 10^10^3 means 10^(10^3) = 10^1000
      let currentLog10 = null;
      let currentValue = null;
      
      // Start at the very top of the power tower
      let topExpr = parts[parts.length - 1];
      currentValue = Function(`"use strict"; return (${topExpr})`)();
      
      // Step downwards through the tower layers
      for (let i = parts.length - 2; i >= 0; i--) {
        let baseStr = parts[i];
        let coeffOuter = 1;
        
        // Pull out front multipliers if present (like 6 * 2^10)
        if (i === 0 && baseStr.includes('*')) {
          const multParts = baseStr.split('*');
          coeffOuter = Function(`"use strict"; return (${multParts[0]})`)();
          baseStr = multParts[1];
        }
        
        let base = Function(`"use strict"; return (${baseStr})`)();
        
        if (currentLog10 === null) {
          // Normal layer calculation
          if (Number.isFinite(currentValue) && Math.pow(base, currentValue) < 1e300) {
            currentValue = coeffOuter * Math.pow(base, currentValue);
          } else {
            // Drop into log scale if it blows past native memory limit
            currentLog10 = Math.log10(coeffOuter) + (currentValue * Math.log10(base));
            currentValue = null;
          }
        } else {
          // If a higher layer already forced us into log scale, we do a nested log calculation
          // log10(base^exponent) = exponent * log10(base)
          // Since exponent is already tracked as 10^currentLog10, we accumulate!
          currentLog10 = currentLog10 + Math.log10(Math.log10(base));
        }
      }
      
      if (currentLog10 !== null) {
        formatWithThreshold(display, null, currentLog10);
      } else {
        formatWithThreshold(display, currentValue);
      }
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
      formatWithThreshold(display, result);
      return;
    }
  } catch (e) {}

  renderMath(display, `\\text{Error: Could not compute.}`);
}

function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  MathJax.typesetPromise([element]).catch((err) => console.log(err));
}