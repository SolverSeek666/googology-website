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

// Converts a break_eternity Decimal object into beautiful LaTeX
function formatDecimalToLatex(d) {
  if (d.isNaN()) return "\\text{NaN}";
  if (!d.isFinite()) return "\\infty";

  // Layer 0: Normal Numbers (e.g., 5, 1234, 1.23e10)
  if (d.layer === 0) {
    if (d.mag < 1e10) {
      // Small integers or simple floats
      let rounded = Math.round(d.mag * 10000) / 10000;
      return String(rounded);
    }
    // Standard Scientific Notation
    let exp = Math.floor(Math.log10(d.mag));
    let mantissa = (d.mag / Math.pow(10, exp));
    if (mantissa.toFixed(4) === "10.0000") {
      mantissa = 1;
      exp += 1;
    }
    if (mantissa.toFixed(4) === "1.0000") {
      return `10^{${exp}}`;
    }
    return `${mantissa.toFixed(4)} \\times 10^{${exp}}`;
  }

  // Layer 1: E-Notation (e.g., 10^100)
  if (d.layer === 1) {
    let exp = d.mag;
    if (exp < 1e10) {
      let intExp = Math.floor(exp);
      let coeff = Math.pow(10, exp - intExp);
      if (coeff.toFixed(4) === "10.0000") { coeff = 1; intExp += 1; }
      if (coeff.toFixed(4) === "1.0000") {
        return `10^{${intExp}}`;
      }
      return `${coeff.toFixed(4)} \\times 10^{${intExp}}`;
    }
    // High Layer 1 (10^1e10+)
    return `10^{${formatDecimalToLatex(new Decimal(exp))}}`;
  }

  // Layer 2: ee-Notation (e.g., 10^10^100)
  if (d.layer === 2) {
    return `10^{10^{${formatDecimalToLatex(new Decimal(d.mag))}}}`;
  }

  // Layer 3+: Tetration Shorthand Arrow Notation
  let magStr = (Math.abs(d.mag - 1) < 1e-4) ? "" : ` > ${d.mag.toFixed(4)}`;
  return `10 \\uparrow\\uparrow ${d.layer}${magStr}`;
}


function processGoogology(rawInput) {
  const display = document.getElementById('outputDisplay');
  if (!display) return;
  
  // Clean up input
  let expr = rawInput.toLowerCase().replace(/x/g, '*').replace(/\s+/g, '');
  expr = expr.replace(/phi/g, `(${PHI})`);
  
  // Easter Eggs / Shortcuts
  if (expr === 'googol') return renderMath(display, `\\text{Result: } 10^{100}`); 
  if (expr === 'googolplex') return renderMath(display, `\\text{Result: } 10^{10^{100}}`); 

  try {
    // 1. TETRATION ENGINE (^^)
    if (expr.includes('^^')) {
      const parts = expr.split('^^');
      let baseStr = parts[0] === "" ? "10" : parts[0]; 
      let rest = parts[parts.length - 1];
      
      let yStr = rest;
      let barrierStr = "1";
      if (rest.includes('>')) {
        const subParts = rest.split('>');
        yStr = subParts[0];
        barrierStr = subParts[1];
      }

      // Convert parts to Decimal
      let base = evaluateMath(baseStr);
      let y = evaluateMath(yStr);
      let barrier = evaluateMath(barrierStr);
      
      let result = base.tetrate(y.toNumber());
      
      // If there is a barrier (e.g. 10^^3 > 5), multiply it at the end (roughly translates to height adjusting)
      if (barrier.gt(1)) {
         result = result.pow(barrier); 
      }
      
      renderMath(display, formatDecimalToLatex(result));
      return;
    }

    // 2. FACTORIAL ENGINE (!)
    if (expr.endsWith('!')) {
      let numStr = expr.slice(0, -1);
      let x = evaluateMath(numStr);
      
      if (x.gt(-1)) {
        // Stirling's Approximation natively applied for large numbers using Decimal
        let result;
        if (x.lt(21) && x.eq(x.round())) {
            result = new Decimal(1);
            for (let i = 2; i <= x.toNumber(); i++) result = result.mul(i);
        } else {
            let n = x;
            // ln(n!) = n*ln(n) - n + 0.5*ln(2*pi*n)
            let logFact = n.mul(n.ln()).sub(n).add(n.mul(2 * Math.PI).ln().mul(0.5));
            // Convert ln back to base 10 log by dividing by ln(10), then form Decimal
            result = Decimal.pow(10, logFact.div(Math.log(10)));
        }
        renderMath(display, formatDecimalToLatex(result));
        return;
      }
    }

    // 3. EXPONENT & MULTIPLICATION ENGINE (Standard Parse)
    let result = evaluateMath(expr);
    renderMath(display, formatDecimalToLatex(result));

  } catch (err) {
    renderMath(display, `\\text{Error: Could not compute.}`);
  }
}

// A simple recursive evaluator to parse ^ and * using Decimal natively
function evaluateMath(expr) {
  // If it's a raw number or E-notation, Decimal parses it natively
  try {
    let checkDirect = new Decimal(expr);
    if (!checkDirect.isNaN()) return checkDirect;
  } catch(e) {}

  // Parse powers (Right-associative)
  if (expr.includes('^')) {
    let parts = expr.split('^');
    let current = evaluateMath(parts[parts.length - 1]);
    for (let i = parts.length - 2; i >= 0; i--) {
      let base = evaluateMath(parts[i]);
      current = base.pow(current);
    }
    return current;
  }

  // Parse multiplication (Left-associative)
  if (expr.includes('*')) {
    let parts = expr.split('*');
    let current = evaluateMath(parts[0]);
    for (let i = 1; i < parts.length; i++) {
      current = current.mul(evaluateMath(parts[i]));
    }
    return current;
  }

  // Fallback to JS if it's something weird (like 2+2) 
  let jsExpr = expr.replace(/\^/g, '**');
  let result = Function(`"use strict"; return (${jsExpr})`)();
  return new Decimal(result);
}

function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  if (window.MathJax) {
     MathJax.typesetPromise([element]).catch((err) => console.log(err));
  }
}