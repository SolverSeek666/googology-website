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

// NEW HELPER: Parses any expression or sub-expression structurally using logs to avoid the 10^308 Infinity wall
function parseToStructural(rawStr) {
  let expr = rawStr.trim().toLowerCase().replace(/\s+/g, '').replace(/x/g, '*');
  
  // If it's a flat number or simple scientific notation, handle safely
  if (!expr.includes('^')) {
    if (expr.includes('e')) {
      let [c, e] = expr.split('e');
      let coeff = parseFloat(c);
      let exp = parseFloat(e);
      return { value: exp + Math.log10(coeff), height: 1, latex: `${c} \\times 10^{${e}}` };
    }
    let val = Function(`"use strict"; return (${expr})`)();
    if (Number.isFinite(val)) {
      return { value: val, height: 0, latex: String(val) };
    }
    return { value: Infinity, height: 0, latex: "\\infty" };
  }

  // If it's a power tower (like 2^1024 or 10^10^10), parse from right to left using log-space
  const parts = expr.split('^');
  let current = { value: null, height: 0 };
  let topExpr = parts[parts.length - 1].replace(/\*\*/g, '^');
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
  
  // Build pristine LaTeX representation of the parsed argument
  let latex = "";
  if (current.height === 0) {
    latex = String(current.value);
  } else if (current.height === 1) {
    let exp = Math.floor(current.value);
    let coeff = Math.pow(10, current.value - exp);
    if (Math.abs(coeff - 10) < 1e-4) { coeff = 1; exp += 1; }
    if (Math.abs(coeff - 1) < 1e-4) {
      latex = `10^{${exp}}`;
    } else {
      latex = `${Number(coeff.toFixed(4))} \\times 10^{${exp}}`;
    }
  } else {
    let exp = Math.floor(current.value);
    let coeff = Math.pow(10, current.value - exp);
    if (Math.abs(coeff - 10) < 1e-4) { coeff = 1; exp += 1; }
    latex = (Math.abs(coeff - 1) < 1e-4) ? `${exp}` : `${Number(coeff.toFixed(4))} \\times 10^{${exp}}`;
    for (let h = 0; h < current.height; h++) {
      latex = `10^{${latex}}`;
    }
  }
  
  return { value: current.value, height: current.height, latex: latex };
}

function formatTower(display, data) {
  let heightStr = "";
  let isAstronomical = false;
  
  // Determine if the height configuration passes your 10^^10^10 threshold
  if (data.heightStruct) {
    heightStr = data.heightStruct.latex;
    if (data.heightStruct.height > 0 || data.heightStruct.value >= 1e10) {
      isAstronomical = true;
    }
  } else {
    heightStr = data.heightStr;
    if (data.heightNum >= 1e10) {
      isAstronomical = true;
    }
  }
  
  let b = data.value;
  
  // CONDITIONAL AUTO-SWITCH: If height >= 10^10, completely drop the barrier suffix
  if (isAstronomical || Math.abs(b - 1) < 1e-4 || b.toFixed(4) === "1.0000") {
    renderMath(display, `10 \\uparrow\\uparrow {${heightStr}}`);
  } else {
    let bStr = b < 1e10 ? Number(b.toFixed(4)).toString() : (typeof formatValueClean === 'function' ? formatValueClean(b) : String(b));
    if (bStr.includes('1.0000') || bStr === "1") {
      renderMath(display, `10 \\uparrow\\uparrow {${heightStr}}`);
    } else {
      renderMath(display, `10 \\uparrow\\uparrow {${heightStr}} > ${bStr}`);
    }
  }
}

// Ensure renderHeight1 also has no hardcoded prefix text leaks
function renderHeight1(display, logVal) {
  let exp = Math.floor(logVal);
  let coeff = Math.pow(10, logVal - exp);
  if (coeff.toFixed(4) === "10.0000") { coeff = 1; exp += 1; }
  let coeffStr = coeff.toFixed(4);
  if (coeffStr === "1.0000") {
    renderMath(display, `10^{${typeof formatValueClean === 'function' ? formatValueClean(exp) : exp}}`);
  } else {
    renderMath(display, `${coeffStr} \\times 10^{${typeof formatValueClean === 'function' ? formatValueClean(exp) : exp}}`);
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

    // 1. DYNAMIC BASE TETRATION & BARRIER ENGINE (BYPASSES NATIVE FLOATS)
  if (expr.includes('^^')) {
    try {
      const parts = expr.split('^^');
      let baseExpr = parts[0] === "" ? "10" : parts[0]; 
      let baseStruct = parseToStructural(baseExpr);
      let base = (baseStruct.height === 0) ? baseStruct.value : Infinity;
      
      let rest = parts[1];
      let yExpr, barrierExpr = "1";
      
      if (rest.includes('>')) {
        const subParts = rest.split('>');
        yExpr = subParts[0];
        barrierExpr = subParts[1];
      } else {
        yExpr = rest;
      }
      
      // Safely parse potentially massive structural inputs
      let yStruct = parseToStructural(yExpr);
      let barrierStruct = parseToStructural(barrierExpr);
      let barrier = (barrierStruct.height === 0) ? barrierStruct.value : 1;
      
      let isYHuge = (yStruct.height > 0 || yStruct.value > 10);
      
      // If base is exactly 10, skip loops entirely and project directly
      if (Math.abs(base - 10) < 1e-7) {
         formatTower(display, { heightStruct: yStruct, value: barrier });
         return;
      }
      
      // Base-conversion cycle limited to a maximum of 10 structural layers
      let current = { value: barrier, height: 0 };
      let iters = isYHuge ? 10 : Math.min(yStruct.value, 10);
      
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
      
      if (isYHuge) {
        formatTower(display, { heightStruct: yStruct, value: current.value });
      } else {
        let finalHeight = current.height;
        if (yStruct.value > 10) finalHeight += (yStruct.value - 10);
        formatTower(display, { heightStr: String(finalHeight), value: current.value, heightNum: finalHeight });
      }
      return;
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