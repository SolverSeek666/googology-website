const PHI = (1 + Math.sqrt(5)) / 2;

document.getElementById('calcInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const input = this.value.trim();
    if (input) {
      processGoogology(input);
    }
  }
});

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
      // Evaluate the absolute top element first (e.g., 5 in 3^4^5)
      let topExpr = parts[parts.length - 1];
      let val = Function(`"use strict"; return (${topExpr})`)();
      
      // Process downward through the tower layers step-by-step
      for (let i = parts.length - 2; i >= 0; i--) {
        let baseStr = parts[i];
        let coeffOuter = 1;
        
        if (i === 0 && baseStr.includes('*')) {
          const multParts = baseStr.split('*');
          coeffOuter = Function(`"use strict"; return (${multParts[0]})`)();
          baseStr = multParts[1];
        }
        
        let base = Function(`"use strict"; return (${baseStr})`)();
        
        // Calculate log10(base^val) = val * log10(base)
        let log10Base = Math.log10(base);
        val = val * log10Base;
        
        if (i === 0 && coeffOuter !== 1) {
          val += Math.log10(coeffOuter);
        }
      }
      
      formatWithThreshold(display, null, val);
      return;
      
    } catch (err) {
      // Fall through if standard parsing fails
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

function formatWithThreshold(display, value, log10Value = null) {
  let logVal = log10Value !== null ? log10Value : Math.log10(Math.abs(value));
  
  if (value !== null && Number.isFinite(value) && Math.abs(value) < 10000000000) {
    let outputStr = Number(value.toFixed(10)).toString();
    renderMath(display, `\\text{Result: } ${outputStr}`);
  } else {
    let expOut = Math.floor(logVal);
    let coeffOut = Math.pow(10, logVal - expOut);
    
    // Hardening check: If the exponent is huge, render it as a nested power tower format
    if (expOut > 1000000) {
      let superLog = Math.log10(logVal);
      let superExp = Math.floor(superLog);
      let superCoeff = Math.pow(10, superLog - superExp);
      
      renderMath(display, `\\text{Result: } 1.0000 \\times 10^{${superCoeff.toFixed(4)} \\times 10^{${superExp}}}`);
    } else if (expOut.toString().includes('e')) {
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

function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  MathJax.typesetPromise([element]).catch((err) => console.log(err));
}