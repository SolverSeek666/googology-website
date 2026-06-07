// I use gemini to help me lmao

// ============================================================================
// SECTION 1: SETUP & INPUT (YOUR ORIGINAL ARCHITECTURE)
// ============================================================================

const PHI = (1 + Math.sqrt(5)) / 2;

// 1. Listen for the "Enter" key in the input box to trigger the calculation
document.getElementById('calcInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    calculate(); 
  }
});

// 2. Appends values directly to the user's blinking cursor location
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

// 3. The actual calculation engine (No parser, just pure translation)
function calculate() {
  const inputEl = document.getElementById('calcInput');
  const displayEl = document.getElementById('outputDisplay');
  if (!inputEl || !displayEl) return;

  // Grab the raw text exactly as it looks in the text box
  let expr = inputEl.value;

  try {
    if (!expr.trim()) {
      throw new Error("Please enter an expression");
    }

    // Translate symbols to what JavaScript actually understands
    expr = expr.replace(/π/g, 'Math.PI'); 
    expr = expr.replace(/e/g, 'Math.E'); 
    expr = expr.replace(/∞/g, 'Infinity'); 
    expr = expr.replace(/ϕ/g, 'PHI'); 
    
    expr = expr.replace(/sin/g, 'Math.sin');
    expr = expr.replace(/cos/g, 'Math.cos');
    expr = expr.replace(/tan/g, 'Math.tan');
    expr = expr.replace(/√/g, 'Math.sqrt');
    
    expr = expr.replace(/log/g, 'Math.log10');
    expr = expr.replace(/ln/g, 'Math.log');
    
    expr = expr.replace(/\^/g, '**'); // Turn exponent ^ into JS **

    // Run the calculation directly on the translated string!
    let result = eval(expr);

    // Display the result using your MathJax format
    displayEl.innerHTML = `\\[ \\text{Result: } ${result} \\]`;

  } catch (err) {
    // If the user types bad math (like "5 ++/ 2"), catch the error gracefully
    displayEl.innerHTML = `\\[ \\text{Error: ${err.message}} \\]`;
  }

  // Tell MathJax to make the math look pretty on screen
  if (window.MathJax) {
    window.MathJax.typesetPromise([displayEl]);
  }
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
