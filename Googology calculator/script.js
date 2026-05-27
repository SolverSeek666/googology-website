// I use gemini to help me lmao

// Ensure OmegaNum is safely accessible
const OmegaNum = window.OmegaNum || require("omega-num");

// Pass a string or number to initialize properly
const PHI = new OmegaNum((1 + Math.sqrt(5)) / 2);

document.getElementById('calcInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const input = this.value.trim();
    if (input) {
      processGoogology(input);
    }
  }
});

/**
 * FIXED LATEX FORMATTER FOR OMEGANUM
 * Parses OmegaNum's native string format into clean MathJax symbols.
 */
function renderOmegaNumResult(display, omniValue) {
  let latex = "";

  if (omniValue.lt(1e10)) {
    latex = Math.floor(omniValue.toNumber()).toString();
  } else {
    // Using string output which produces configurations like "10^^5" or "e100"
    let rawStr = omniValue.toString();
    
    if (rawStr.includes('e')) {
      // Formats e.g. "e1e100" into 10^{10^{100}}
      let parts = rawStr.split('e');
      if (parts[0] === "" || parts[0] === "1") {
        latex = "10^{" + parts.slice(1).join('10^{') + "}".repeat(parts.length - 1);
      } else {
        latex = `${parts[0]} \\times 10^{` + parts.slice(1).join('10^{') + "}".repeat(parts.length - 1);
      }
    } else if (rawStr.includes('^')) {
      // Formats OmegaNum's arrow outputs (e.g., "10^^5" -> "10 \uparrow\uparrow 5")
      latex = rawStr.replace(/\^\^\^/g, ' \\uparrow\\uparrow\\uparrow ')
                    .replace(/\^\^/g, ' \\uparrow\\uparrow ')
                    .replace(/\^/g, ' \\uparrow ');
    } else {
      latex = rawStr;
    }
  }

  renderMath(display, `\\text{Result: } ${latex}`);
}

/**
 * FIXED FACTORIAL ENGINE
 * Replaced the manual .pi lookup with standard float approximation mapped cleanly to OmegaNum.
 */
function omegaFactorial(n) {
  if (n.lt(0)) return new OmegaNum(NaN);
  if (n.isZero()) return new OmegaNum(1);
  if (n.lte(20)) {
    let result = new OmegaNum(1);
    for (let i = 2; i <= n.toNumber(); i++) {
      result = result.times(i);
    }
    return result;
  }

  // Stirling's Approximation using explicitly supported OmegaNum operations:
  // ln(n!) ≈ 0.5 * ln(2 * pi * n) + n * ln(n) - n
  const piOM = new OmegaNum(Math.PI);
  
  const part1 = n.times(piOM).times(2).ln().times(0.5);
  const part2 = n.times(n.ln());
  const lnFact = part1.plus(part2).minus(n);

  return lnFact.exp();
}

/**
 * RIGHT-TO-LEFT MATH EXPRESSION PARSER
 * Evaluates inputs ensuring power towers evaluate correctly.
 */
function evaluateOmegaExpression(expr) {
  if (expr.includes('^')) {
    const parts = expr.split('^');
    let current = evaluateOmegaExpression(parts[parts.length - 1]);
    
    for (let i = parts.length - 2; i >= 0; i--) {
      let base = evaluateOmegaExpression(parts[i]);
      current = base.pow(current);
    }
    return current;
  }

  if (expr.includes('*')) {
    return expr.split('*')
               .map(evaluateOmegaExpression)
               .reduce((a, b) => a.times(b));
  }

  if (expr.includes('/')) {
    return expr.split('/')
               .map(evaluateOmegaExpression)
               .reduce((a, b) => a.div(b));
  }

  if (expr.includes('+')) {
    return expr.split('+')
               .map(evaluateOmegaExpression)
               .reduce((a, b) => a.plus(b));
  }

  if (expr === 'phi') return PHI;
  
  let cleanExpr = expr.replace(/[()]/g, '');
  return new OmegaNum(cleanExpr);
}

/**
 * MAIN INPUT PROCESSOR
 */
function processGoogology(rawInput) {
  const display = document.getElementById('outputDisplay');
  
  let expr = rawInput.toLowerCase().replace(/x/g, '*').replace(/\s+/g, '');
  
  // Explicit assignments using strings so JS numbers don't lose precision or throw errors
  if (expr === 'googol') { 
    return renderOmegaNumResult(display, new OmegaNum("1e100")); 
  }
  if (expr === 'googolplex') { 
    return renderOmegaNumResult(display, OmegaNum.pow("10", "1e100")); 
  }
  if (expr === 'googolduplex') {
    return renderOmegaNumResult(display, OmegaNum.pow("10", OmegaNum.pow("10", "1e100")));
  }

  // Factorials
  if (expr.endsWith('!')) {
    let numStr = expr.slice(0, -1);
    try {
      let innerValue = evaluateOmegaExpression(numStr);
      if (!innerValue.isNaN()) {
        let result = omegaFactorial(innerValue);
        renderOmegaNumResult(display, result);
        return;
      }
    } catch(err) {
      renderMath(display, `\\text{Error: Invalid factorial input.}`);
      return;
    }
  }

  // Base Numbers and Power Towers
  try {
    let result = evaluateOmegaExpression(expr);
    if (!result.isNaN() && result.isFinite()) {
      renderOmegaNumResult(display, result);
      return;
    }
  } catch (e) {
    // Fail silently to render error
  }

  renderMath(display, `\\text{Error: Could not compute.}`);
}

function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  MathJax.typesetPromise([element]).catch((err) => console.log(err));
}