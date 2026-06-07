// I use gemini to help me lmao

// ============================================================================
// CALCULATION ENGINE
// ============================================================================

// Listen for the "Enter" key in the input box
document.getElementById('calcInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    calculate(); 
  }
});

// Appends values directly to the user's blinking cursor location
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

    // 1. FIX: Auto-wrap square roots written without parentheses (like √16 or √π)
    expr = expr.replace(/√(\d+(?:\.\d+)?|[πeϕ∞])/g, '√($1)');

    // 2. TRANSLATE: Point your custom symbols to our helper functions
    expr = expr.replace(/√/g, 'customRoot');
    expr = expr.replace(/log/g, 'customLog');
    
    // 3. TRANSLATE: Standard constants and functions
    expr = expr.replace(/x/g, '*'); 
    expr = expr.replace(/π/g, 'Math.PI'); 
    expr = expr.replace(/e/g, 'Math.E'); 
    expr = expr.replace(/∞/g, 'Infinity'); 
    expr = expr.replace(/ϕ/g, '1.6180339887'); 
    
    expr = expr.replace(/sin/g, 'Math.sin');
    expr = expr.replace(/cos/g, 'Math.cos');
    expr = expr.replace(/tan/g, 'Math.tan');
    expr = expr.replace(/ln/g, 'Math.log');
    expr = expr.replace(/\^/g, '**'); 

    // 4. EVALUATE
    let result = eval(expr);

    // 5. FIX: If the output is Infinity, format it as a beautiful LaTeX symbol
    let displayResult = result;
    if (result === Infinity) {
      displayResult = '\\infty';
    } else if (result === -Infinity) {
      displayResult = '-\\infty';
    }

    // Display the final result using MathJax layout
    displayEl.innerHTML = `\\[ \\text{Result: } ${displayResult} \\]`;

  } catch (err) {
    displayEl.innerHTML = `\\[ \\text{Error: ${err.message}} \\]`;
  }

  // Render LaTeX properly
  if (window.MathJax) {
    window.MathJax.typesetPromise([displayEl]);
  }
}

// ============================================================================
// HELPER FUNCTIONS (Teaching JavaScript your custom math rules)
// ============================================================================

// Handles BOTH square roots √(x) and custom roots √(degree, number)
function customRoot(a, b) {
  if (b === undefined) {
    return Math.sqrt(a); // If only one number, do normal square root
  }
  return Math.pow(b, 1 / a); // If two numbers, calculate the a-th root of b
}

// Handles BOTH standard log(x) [base 10] and custom log(base, number)
function customLog(a, b) {
  if (b === undefined) {
    return Math.log10(a); // If only one number, default to base 10
  }
  return Math.log(b) / Math.log(a); // Change of base formula: ln(b) / ln(a)
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
