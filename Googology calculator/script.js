// I use gemini to help me lmao

const Decimal = window.Decimal || require("break_eternity.js");

const Pi = Decimal.dPi;
const E = Decimal.dE;
const Phi = Decimal.fromComponents(1, 0, (1 + Math.sqrt(5)) / 2);

document.getElementById('calcInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const input = this.value.trim();
    if (input) {
      processGoogology(input);
    }
  }
});

/**
 * CLEAN LATEX FORMATTER USING BREAK_ETERNITY NATIVE CAPABILITIES
 * Automatically converts extremely large values into clean LaTeX power towers.
 */
function renderDecimalResult(display, decimalValue) {
  let latex = "";

  // If it's a standard/small number, show cleanly
  if (decimalValue.lt(1e10)) {
    latex = Math.floor(decimalValue.toNumber()).toString();
  } else {
    // break_eternity has built-in LaTeX generation for layer-1, layer-2, and layer-3+ numbers!
    latex = decimalValue.toLatex();
  }

  renderMath(display, `${latex}`);
}

/**
 * BREAK_ETERNITY FACTORIAL ENGINE
 * Uses Stirling's approximation optimized for Decimal types.
 */
function decimalFactorial(n) {
  if (n.lt(0)) return new Decimal(NaN);
  if (n.isZero()) return new Decimal(1);
  if (n.lte(20)) {
    // Exact calculation for small numbers
    let result = new Decimal(1);
    for (let i = 2; i <= n.toNumber(); i++) {
      result = result.times(i);
    }
    return result;
  }

  // Stirling's Approximation: n! ≈ sqrt(2 * pi * n) * (n / e)^n
  // In logarithmic space for huge numbers: ln(n!) ≈ 0.5 * ln(2 * pi * n) + n * ln(n) - n
  
  const part1 = Decimal.ln(n.times(Pi).times(2)).times(0.5);
  const part2 = n.times(Decimal.ln(n));
  const lnFact = part1.plus(part2).minus(n);

  return Decimal.exp(lnFact);
}

/**
 * SAFE MATHEMATICAL EXPRESSION EVALUATOR
 * Safely parses basic tokens (+, -, *, /, ^) using Decimal functions.
 */
function evaluateDecimalExpression(expr) {
  // Handle power towers properly by parsing right-to-left (Right-Associative)
  if (expr.includes('^')) {
    const parts = expr.split('^');
    let current = evaluateDecimalExpression(parts[parts.length - 1]);
    
    for (let i = parts.length - 2; i >= 0; i--) {
      let base = evaluateDecimalExpression(parts[i]);
      current = base.pow(current);
    }
    return current;
  }

  // Handle Multiplication
  if (expr.includes('*')) {
    return expr.split('*')
               .map(evaluateDecimalExpression)
               .reduce((a, b) => a.times(b));
  }

  // Handle Division
  if (expr.includes('/')) {
    return expr.split('/')
               .map(evaluateDecimalExpression)
               .reduce((a, b) => a.div(b));
  }

  // Handle Addition
  if (expr.includes('+')) {
    return expr.split('+')
               .map(evaluateDecimalExpression)
               .reduce((a, b) => a.plus(b));
  }

  // Base Case: Convert raw number or constants to Decimal
  if (expr === 'pi') return Pi;
  if (expr === 'e') return E;
  if (expr === 'phi') return Phi;
  
  // Clean up remaining brackets if any
  let cleanExpr = expr.replace(/[()]/g, '');
  return new Decimal(cleanExpr);
}

/**
 * MAIN GOOGOLOGY PROCESSOR
 */
function processGoogology(rawInput) {
  const display = document.getElementById('outputDisplay');
  
  // Normalize string inputs
  let expr = rawInput.toLowerCase().replace(/x/g, '*').replace(/\s+/g, '');
  
  // Named Googology Constants
  if (expr === 'googol') { 
    return renderDecimalResult(display, new Decimal("1e100")); 
  }
  if (expr === 'googolplex') { 
    return renderDecimalResult(display, new Decimal("1e100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000")); 
    // Or natively via layer components: Decimal.fromComponents(1, 2, 100) -> 10^10^100
  }

  // 1. FACTORIAL SYSTEM
  if (expr.endsWith('!')) {
    let numStr = expr.slice(0, -1);
    try {
      let innerValue = evaluateDecimalExpression(numStr);
      if (!innerValue.isNaN()) {
        let result = decimalFactorial(innerValue);
        renderDecimalResult(display, result);
        return;
      }
    } catch(err) {
      renderMath(display, `\\text{Error: Invalid factorial input.}`);
      return;
    }
  }

  // 2. STANDARD & POWER TOWER SYSTEM
  try {
    let result = evaluateDecimalExpression(expr);
    if (!result.isNaN() && result.isFinite()) {
      renderDecimalResult(display, result);
      return;
    }
  } catch (e) {
    // Fall through to error
  }

  renderMath(display, `\\text{Error: Could not compute.}`);
}

// MathJax Renderer
function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  MathJax.typesetPromise([element]).catch((err) => console.log(err));
}