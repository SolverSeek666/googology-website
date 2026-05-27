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

function formatTower(display, current) {
  // HELPER: Intercepts raw JS scientific notation (1e+25) and forces it into LaTeX (10^{25})
  const toLatexSci = (num) => {
    let str = String(num);
    if (str.includes('e')) {
      let [coeff, exp] = str.split('e');
      exp = exp.replace('+', ''); // Clean up the '+' sign JS adds
      if (coeff === '1') return `10^{${exp}}`;
      return `${coeff} \\times 10^{${exp}}`;
    }
    // Fallback to your existing clean function for normal numbers
    return typeof formatValueClean === 'function' ? formatValueClean(num) : str;
  };

  // AUTOMATIC TETRATION SWITCH (Triggered at 10^^6 and above)
  if (current.height >= 6) {
    let a = current.height;
    let b = current.value;
    
    // Normalize: if the top value rounds to 10, absorb it into the tower height
    if (Math.abs(b - 10) < 1e-4 || b.toFixed(4) === "10.0000") {
      a += 1;
      b = 1;
    }
    
    // Apply our new forced-LaTeX string converter to the height
    let heightStr = toLatexSci(a);
    
    if (Math.abs(b - 1) < 1e-4 || b.toFixed(4) === "1.0000") {
      // "Result:" text removed!
      renderMath(display, `10 \\uparrow\\uparrow {${heightStr}}`);
    } else {
      let bStr = b < 1e10 ? Number(b.toFixed(4)).toString() : toLatexSci(b);
      renderMath(display, `10 \\uparrow\\uparrow {${heightStr}} > ${bStr}`);
    }
    return;
  }

  // STANDARD POWER TOWERS (For heights below 6)
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
      latex = toLatexSci(exp);
    } else {
      latex = `${coeffStr} \\times 10^{${toLatexSci(exp)}}`;
    }
    
    for (let h = 0; h < current.height; h++) {
      latex = `10^{${latex}}`;
    }
    renderMath(display, `${latex}`);
  }
}

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

  // 1. DYNAMIC BASE TETRATION & BARRIER ENGINE
  if (expr.includes('^^')) {
    try {
      const parts = expr.split('^^');
      // Default to base 10 if omitted (e.g., "^^6")
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
        
        // If the base is exactly 10, skip iteration and apply structural height directly
        if (Math.abs(base - 10) < 1e-7) {
           formatTower(display, { value: barrier, height: y });
           return;
        }
        
        // LIMIT ITERATIONS: Calculate true power tower up to 10 layers deep
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
        
        // ANTI-CRASH OPTIMIZATION: If y > 10, just tack the remainder onto the base-10 height
        if (y > 10) {
          current.height += (y - 10);
        }
        
        formatTower(display, current);
        return;
      }
    } catch (err) {
      renderMath(display, `\\text{Error: Invalid tetration syntax.}`);
      return;
    }
  }

  // 2. FACTORIAL ENGINE
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
    } catch(err) { }
  }

  // 3. STRUCTURAL POWER TOWER ENGINE
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
    } catch (err) { }
  }

  // 4. STANDARD NATIVE ENGINE
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