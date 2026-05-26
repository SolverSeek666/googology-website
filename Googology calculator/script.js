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

  // 1. IMPROVED FACTORIAL
  if (expr.endsWith('!')) {
    let numStr = expr.slice(0, -1);
    try {
      let jsNumExpr = numStr.replace(/\^/g, '**');
      let x = Function(`"use strict"; return (${jsNumExpr})`)();
      
      if (!isNaN(x) && x > -1) {
        // BUG FIX: If it's a whole number up to 20, use a direct integer loop for absolute precision
        if (Number.isInteger(x) && x <= 20) {
          let result = 1;
          for (let i = 2; i <= x; i++) result *= i;
          renderMath(display, `\\text{Result: } ${result.toString()}`);
          return;
        } 
        
        // Continuous Gamma Curve approximation for decimals and massive numbers
        let logFact;
        if (x < 12) {
          let originalX = x;
          let p = 1;
          while (x < 12) {
            x++;
            p *= x;
          }
          let logG = 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(x) - x + (1 / (12 * x)) - (1 / (360 * Math.pow(x, 3)));
          logFact = (logG - Math.log(p)) * Math.LOG10E;
        } else {
          let logG = 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(x) - x + (1 / (12 * x)) - (1 / (360 * Math.pow(x, 3)));
          logFact = logG * Math.LOG10E;
        }
        
        if (logFact < 10) {
          let finalAns = Math.pow(10, logFact);
          renderMath(display, `\\text{Result: } ${Number(finalAns.toFixed(10)).toString()}`);
          return;
        } else {
          formatBigLog10(display, logFact);
          return;
        }
      }
    } catch(err) {
      renderMath(display, `\\text{Error: Invalid factorial input.}`);
      return;
    }
  }

  // 2. STANDARD ENGINE
  let jsExpr = expr.replace(/\^/g, '**');
  try {
    let result = Function(`"use strict"; return (${jsExpr})`)();
    
    if (Number.isFinite(result)) {
      if (Math.abs(result) < 10000000000) {
        let outputStr = Number(result.toFixed(10)).toString();
        renderMath(display, `\\text{Result: } ${outputStr}`);
        return;
      } else {
        let logValue = Math.log10(Math.abs(result));
        formatBigLog10(display, logValue);
        return;
      }
    }
  } catch (e) {
    // Pass to log engine if expression breaks native memory limits
  }

  // 3. LOGARITHM ENGINE: Cleans up the nested e+44 display bugs
  if (expr.includes('^')) {
    const parts = expr.split('^');
    
    if (parts.length === 2) {
      let coeffOuter = 1;
      let baseStr = parts[0];
      
      if (baseStr.includes('*')) {
        const multParts = baseStr.split('*');
        coeffOuter = Function(`"use strict"; return (${multParts[0]})`)();
        baseStr = multParts[1];
      }
      
      let base = Function(`"use strict"; return (${baseStr})`)();
      let exponent = Function(`"use strict"; return (${parts[1]})`)();
      
      if (!isNaN(base) && !isNaN(exponent) && !isNaN(coeffOuter) && base > 0) {
        let totalLog = Math.log10(coeffOuter) + (exponent * Math.log10(base));
        formatBigLog10(display, totalLog);
        return;
      }
    }
  }

  renderMath(display, `\\text{Error: Could not compute.}`);
}

// HELPER FUNCTION: Prevents standard "e+" text notation leaks inside exponents
function formatBigLog10(display, totalLog) {
  let expOut = Math.floor(totalLog);                       
  let coeffOut = Math.pow(10, totalLog - expOut);

  // If the exponent itself is massive enough to trigger JS scientific notation (like 1e+44)
  if (expOut.toString().includes('e')) {
    let eNotation = expOut.toExponential(4);
    let parts = eNotation.split('e');
    let innerCoeff = parts[0];
    let innerExp = parts[1].replace('+', '');
    
    // Renders cascading towers clean: m * 10^(a * 10^b)
    renderMath(display, `\\text{Result: } ${coeffOut.toFixed(4)} \\times 10^{${innerCoeff} \\times 10^{${innerExp}}}`);
  } else {
    renderMath(display, `\\text{Result: } ${coeffOut.toFixed(4)} \\times 10^{${expOut}}`);
  }
}

function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  MathJax.typesetPromise([element]).catch((err) => console.log(err));
}