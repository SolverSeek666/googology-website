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

// Parses any expression or sub-expression structurally using logs
function parseToStructural(rawStr) {
  let expr = rawStr.trim().toLowerCase().replace(/\s+/g, '').replace(/x/g, '*');
  
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
  const toLatexSci = (num) => {
    if (num === Infinity || num === "Infinity") return "\\infty";
    let str = String(num);
    if (str.includes('e')) {
      let [coeff, exp] = str.split('e');
      exp = exp.replace('+', '');
      let cNum = parseFloat(coeff);
      if (Math.abs(cNum - 1) < 1e-10) return `10^{${exp}}`;
      let roundedCoeff = Number(cNum.toFixed(4));
      if (roundedCoeff === 1) return `10^{${exp}}`;
      return `${roundedCoeff} \\times 10^{${exp}}`;
    }
    let n = Number(num);
    if (!isNaN(n) && Math.abs(n - Math.round(n)) < 1e-10) return String(Math.round(n));
    return typeof formatValueClean === 'function' ? formatValueClean(num) : str;
  };

  let current = data; 
  let isTetration = current.forceTetration || (current.height !== undefined && current.height >= 6);

  // 1. TETRATION RENDERING PATH
  if (isTetration) {
    let heightStr = current.forceTetration ? current.tetraHeightStr : toLatexSci(current.height);
    let b = current.value;
    
    if (Math.abs(b - 1) < 1e-4 || b.toFixed(4) === "1.0000") {
      renderMath(display, `10 \\uparrow\\uparrow {${heightStr}}`);
    } else {
      let bStr = b < 1e10 ? Number(b.toFixed(4)).toString() : toLatexSci(b);
      if (bStr === "1" || bStr.includes("1.0000")) {
        renderMath(display, `10 \\uparrow\\uparrow {${heightStr}}`);
      } else {
        renderMath(display, `10 \\uparrow\\uparrow {${heightStr}} > ${bStr}`);
      }
    }
    return;
  }

  // 2. STANDARD POWER TOWERS PATH
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
      if (exp === 1) {
         latex = "10";
         for (let h = 1; h < current.height; h++) {
            latex = `10^{${latex}}`;
         }
      } else {
         latex = toLatexSci(exp);
         for (let h = 0; h < current.height; h++) {
            latex = `10^{${latex}}`;
         }
      }
    } else {
      latex = `${coeffStr} \\times 10^{${toLatexSci(exp)}}`;
      for (let h = 0; h < current.height; h++) {
        latex = `10^{${latex}}`;
      }
    }
    renderMath(display, `${latex}`);
  }
}

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
  
  if (expr === 'googol') return renderMath(display, `\\text{Result: } 10^{100}`); 
  if (expr === 'googolplex') return renderMath(display, `\\text{Result: } 10^{10^{100}}`); 

  // 1. DYNAMIC BASE TETRATION ENGINE
  if (expr.includes('^^')) {
    try {
      const parts = expr.split('^^');
      let baseExpr = parts[0] === "" ? "10" : parts[0]; 
      let baseStruct = parseToStructural(baseExpr);
      let base = (baseStruct.height === 0) ? baseStruct.value : Infinity;
      
      let rest = parts[parts.length - 1];
      let yExpr, barrierExpr = "1";
      if (rest.includes('>')) {
        const subParts = rest.split('>');
        yExpr = subParts[0];
        barrierExpr = subParts[1];
      } else {
        yExpr = rest;
      }
      
      let yStruct = parseToStructural(yExpr);
      let barrierStruct = parseToStructural(barrierExpr);
      let barrier = (barrierStruct.height === 0) ? barrierStruct.value : 1;
      
      // Shortcut: Base 10 exact tower construction
      if (Math.abs(base - 10) < 1e-7) {
         if (yStruct.height === 0) {
             formatTower(display, { value: barrier, height: yStruct.value });
         } else {
             formatTower(display, { forceTetration: true, tetraHeightStr: yStruct.latex, value: barrier });
         }
         return;
      }
      
      let current = { value: barrier, height: 0 };
      let isYHuge = (yStruct.height > 0 || yStruct.value > 20);
      let iters = isYHuge ? 5 : Math.floor(yStruct.value);
      
      function applyBase(b, curr) {
        if (curr.height === 0) {
          let next = Math.pow(b, curr.value);
          if (Number.isFinite(next) && next < 1e300) {
            return { value: next, height: 0 };
          } else {
            return { value: curr.value * Math.log10(b), height: 1 };
          }
        }
        if (curr.height === 1) {
          let innerExp = curr.value + Math.log10(Math.log10(b));
          if (innerExp >= 10) {
            return { value: Math.log10(innerExp), height: 3 };
          } else if (innerExp >= 1) {
            return { value: innerExp, height: 2 };
          } else {
            return { value: Math.pow(10, innerExp), height: 1 };
          }
        }
        if (curr.height === 2) {
          if (curr.value > 15) {
            return { value: curr.value, height: 3 };
          } else {
            let nextVal = Math.log10(Math.pow(10, curr.value) + Math.log10(Math.log10(b)));
            return { value: nextVal, height: 3 };
          }
        }
        return { value: curr.value, height: curr.height + 1 };
      }
      
      for (let i = 0; i < iters; i++) {
        current = applyBase(base, current);
      }
      
      let finalHeight = current.height;
      let targetY = Math.floor(yStruct.value);
      if (yStruct.height === 0 && targetY > iters) {
        finalHeight += (targetY - iters);
      }
      
      if (isYHuge || finalHeight >= 6) {
         let hStr = yStruct.height > 0 ? yStruct.latex : String(finalHeight);
         formatTower(display, { forceTetration: true, tetraHeightStr: hStr, value: current.value });
      } else {
         formatTower(display, { value: current.value, height: finalHeight });
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