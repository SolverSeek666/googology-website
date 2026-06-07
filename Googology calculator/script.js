// I use gemini to help me lmao

// ============================================================================
// CALCULATION ENGINE
// ============================================================================

document.getElementById('calcInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    calculate(); 
  }
});

function appendInput(value) {
  const inputEl = document.getElementById('calcInput');
  if (!inputEl) return;

  const startPos = inputEl.selectionStart;
  const endPos = inputEl.selectionEnd;
  const text = inputEl.value;
  
  inputEl.value = text.substring(0, startPos) + value + text.substring(endPos, text.length);
  
  inputEl.focus();
  inputEl.selectionStart = inputEl.selectionEnd = startPos + value.length;
}

function calculate() {
  const inputEl = document.getElementById('calcInput');
  const displayEl = document.getElementById('outputDisplay');
  if (!inputEl || !displayEl) return;

  let expr = inputEl.value;

  try {
    if (!expr.trim()) {
      throw new Error("Please enter an expression");
    }

    // 1. FIXED: Comma Safety Scanner (Blocks things like √3,5)
    let commaCheck = expr;
    commaCheck = commaCheck.replace(/(?:√|log)\([^)]*,[^)]*\)/g, '');
    if (commaCheck.includes(',')) {
      throw new Error("Syntax Error: Invalid use of comma");
    }

    // 2. FIXED: Implicit Multiplication Injector (Fixes 5ϕ -> 5*ϕ and 2π -> 2*π)
    expr = expr.replace(/(\d+(?:\.\d+)?)([πeϕ∞√\(]|sin|cos|tan|log|ln)/g, '$1*$2');
    expr = expr.replace(/([πeϕ∞\)])(\d+(?:\.\d+)?|[πeϕ∞√\(]|sin|cos|tan|log|ln)/g, '$1*$2');

    // 3. AUTO-WRAP SQUARE ROOT: Safely wraps single numbers/constants (like √16 -> √(16))
    expr = expr.replace(/√(\d+(?:\.\d+)?|[πeϕ∞])/g, '√($1)');

    // 4. TRANSLATE: Connect custom symbols to our helpers
    expr = expr.replace(/√/g, 'customRoot');
    expr = expr.replace(/log/g, 'customLog');
    expr = expr.replace(/tan/g, 'customTan'); 
    
    // 5. TRANSLATE: Everything else
    expr = expr.replace(/x/g, '*'); 
    expr = expr.replace(/π/g, 'Math.PI'); 
    expr = expr.replace(/e/g, 'Math.E'); 
    expr = expr.replace(/∞/g, 'Infinity'); 
    expr = expr.replace(/ϕ/g, '1.6180339887'); 
    
    expr = expr.replace(/sin/g, 'Math.sin');
    expr = expr.replace(/cos/g, 'Math.cos');
    expr = expr.replace(/ln/g, 'Math.log');
    expr = expr.replace(/\^/g, '**'); 

    // 6. EVALUATE
    let rawResult = eval(expr);
    
    // 7. FIX: Clean up trailing floating-point fuzz
    let result = cleanFloat(rawResult);

    // 8. FIX: Format Infinity values for MathJax LaTeX display
    let displayResult = result;
    if (result === Infinity) {
      displayResult = '\\infty';
    } else if (result === -Infinity) {
      displayResult = '-\\infty';
    } else if (isNaN(result)) {
      throw new Error("Invalid Calculation");
    }

    displayEl.innerHTML = `\\[ ${displayResult} \\]`;

  } catch (err) {
    displayEl.innerHTML = `\\[ \\text{Error: ${err.message}} \\]`;
  }

  if (window.MathJax) {
    window.MathJax.typesetPromise([displayEl]);
  }
}

// ============================================================================
// HELPER FUNCTIONS (Smart Math & Error Smasher)
// ============================================================================

// Handles BOTH square roots √(x) and custom roots √(degree, number)
function customRoot(a, b) {
  if (b === undefined) {
    return Math.sqrt(a);
  }
  return Math.pow(b, 1 / a);
}

// Handles BOTH standard log(x) [base 10] and custom log(base, number)
function customLog(a, b) {
  if (b === undefined) {
    return Math.log10(a);
  }
  return Math.log(b) / Math.log(a);
}

// FIX: Prevents tan(π/2) from blowing up into a weird 16-quadrillion number
function customTan(x) {
  if (Math.abs(Math.cos(x)) < 1e-12) {
    return Infinity;
  }
  return Math.tan(x);
}

// FIX: Smashes floating-point fuzz (turns 4.999999999999999 into 5)
function cleanFloat(num) {
  if (typeof num !== 'number' || !isFinite(num)) return num;
  
  if (Math.abs(num - Math.round(num)) < 1e-12) {
    return Math.round(num);
  }
  
  if (Math.abs(num) < 1e12) {
    return parseFloat(num.toPrecision(12));
  }
  
  return num;
}

// ===================================================================
// WEBSITE STUFF ARCHIVE
// ===================================================================

// I deleted parser engine because it's too complicated

function lambertStack(k, n) {
  if (k === 1) return n;
  return n * Math.exp(lambertStack(k - 1, n));
}

function extendedLambertW(k, a) {
  if (a <= 0) return NaN;
  let low = 0;
  let high = Math.max(1, Math.log(a) + 1);
  let mid, guess;
  for (let i = 0; i < 60; i++) {
    mid = (low + high) / 2;
    guess = lambertStack(k, mid);
    if (guess === a) break;
    if (guess < a) low = mid;
    else high = mid;
  }
  return mid;
}

function superRoot(k, a) {
  if (k === 1) return a;
  let wVal = extendedLambertW(k, Math.log(a));
  return Math.exp(wVal);
}
