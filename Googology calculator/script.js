// Define the Golden Ratio constant globally
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
  
  // Clean up input: convert "x" to "*" for multiplication, remove spaces
  let expr = rawInput.toLowerCase().replace(/x/g, '*').replace(/\s+/g, '');
  
  // Replace the word "phi" with its actual numerical value string
  expr = expr.replace(/phi/g, `(${PHI})`);
  
  // 1. Quick lookup for preset Googological names
  if (expr === 'googol') { 
    return renderMath(display, `\\text{Result: } 1 \\times 10^{100}`); 
  }
  if (expr === 'googolplex') { 
    return renderMath(display, `\\text{Result: } 1 \\times 10^{10^{100}}`); 
  }

  // 2. FACTORIAL ENGINE
  if (expr.endsWith('!')) {
    let numStr = expr.slice(0, -1);
    
    // Evaluate the inner string first in case they passed something like "(5)" or "phi"
    try {
      let jsNumExpr = numStr.replace(/\^/g, '**');
      let n = Function(`"use strict"; return (${jsNumExpr})`)();
      
      if (!isNaN(n) && n >= 0) {
        // Round to nearest integer for standard factorial execution
        n = Math.round(n);
        
        if (n <= 13) {
          let result = 1;
          for (let i = 2; i <= n; i++) result *= i;
          renderMath(display, `\\text{Result: } ${result.toString()}`);
          return;
        } else {
          // Stirling's Log10 calculation using native Math.E and Math.PI
          let logFact = n * Math.log10(n / Math.E) + 0.5 * Math.log10(2 * Math.PI * n);
          let expOut = Math.floor(logFact);
          let coeffOut = Math.pow(10, logFact - expOut);
          
          renderMath(display, `\\text{Result: } ${coeffOut.toFixed(4)} \\times 10^{${expOut}}`);
          return;
        }
      }
    } catch(err) {
      renderMath(display, `\\text{Error: Invalid factorial input.}`);
      return;
    }
  }

  // 3. STANDARD ENGINE (For calculations that fit in standard JS memory)
  let jsExpr = expr.replace(/\^/g, '**');
  try {
    let result = Function(`"use strict"; return (${jsExpr})`)();
    
    if (Number.isFinite(result)) {
      // RULE: If below 10^10, display as a raw string without any commas
      if (Math.abs(result) < 10000000000) {
        // Fix JavaScript floating point rounding anomalies for clean decimals
        let outputStr = Number(result.toFixed(10)).toString();
        renderMath(display, `\\text{Result: } ${outputStr}`);
        return;
      } 
      // RULE: If 10^10 or higher, format as m * 10^n
      else {
        let eNotation = result.toExponential(4); 
        let parts = eNotation.split('e');
        let coeff = parseFloat(parts[0]).toString(); 
        let exp = parts[1].replace('+', '');          
        
        renderMath(display, `\\text{Result: } ${coeff} \\times 10^{${exp}}`);
        return;
      }
    }
  } catch (e) {
    // Pass down to manual log engine if native JS evaluation fails
  }

  // 4. LOGARITHM ENGINE (For massive powers like phi^1000)
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
      
      // Handle instances where 'phi' might be wrapped inside the expression base
      let base = Function(`"use strict"; return (${baseStr})`)();
      let exponent = Function(`"use strict"; return (${parts[1]})`)();
      
      if (!isNaN(base) && !isNaN(exponent) && !isNaN(coeffOuter) && base > 0) {
        let totalLog = Math.log10(coeffOuter) + (exponent * Math.log10(base));
        let expOut = Math.floor(totalLog);                       
        let coeffOut = Math.pow(10, totalLog - expOut);          
        
        renderMath(display, `\\text{Result: } ${coeffOut.toFixed(4)} \\times 10^{${expOut}}`);
        return;
      }
    }
    
    // Handles Power Towers (e.g., 10^10^5)
    if (parts.length === 3 && parts[0] === '10' && parts[1] === '10') {
      let topValue = parseFloat(parts[2]);
      if (!isNaN(topValue)) {
        renderMath(display, `\\text{Result: } 1 \\times 10^{10^{${topValue}}}`);
        return;
      }
    }
  }

  renderMath(display, `\\text{Error: Could not compute.}`);
}

function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  MathJax.typesetPromise([element]).catch((err) => console.log(err));
}