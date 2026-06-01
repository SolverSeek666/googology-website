// I use gemini to help me lmao

// ============================================================================
// SECTION 1: SETUP & INPUT (YOUR ORIGINAL ARCHITECTURE)
// ============================================================================

const PHI = (1 + Math.sqrt(5)) / 2;

// Global parser state placeholders
let tokens = [];
let tokenIndex = 0;

function peek() {
  return tokens[tokenIndex] || null;
}

function consume() {
  return tokens[tokenIndex++];
}

function match(t) {
  if (peek() === t) {
    consume();
    return true;
  }
  return false;
}

// Listen for the "Enter" key in the input box to trigger the calculation engine
document.getElementById('calcInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    calculate(); // Directly calls the unified engine!
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

// The core evaluation engine execution block
function calculate() {
  const inputEl = document.getElementById('calcInput');
  const displayEl = document.getElementById('outputDisplay');
  if (!inputEl || !displayEl) return;

  // 1. Clean up & Normalize input
  let expr = inputEl.value
    .replace(/[^E]/g, char => char.toLowerCase())
    .replace(/x/g, '*')
    .replace(/\s+/g, '');

  // 2. Tokenize using the symbol-aware layout
  tokens = expr.match(/\d+(?:\.\d+)?|\^\^|[a-z]+|E|[-+*/^()!>√πϕ∞,Γγ]/g) || [];
  tokenIndex = 0; // Reset pointer for execution

  try {
    if (tokens.length === 0) {
      throw new Error("Please enter an expression");
    }

    // 3. Run the simplified parser engine
    let resultTower = parseExpression();

    // 4. Check if syntax errors left dangling unparsed elements behind
    if (tokenIndex < tokens.length) {
      throw new Error("Unexpected token: " + tokens[tokenIndex]);
    }

    // 5. Send structural tower to display formatter
    formatTower(displayEl, resultTower);

  } catch (err) {
    // Gracefully catch system faults and display an elegant error block
    displayEl.innerHTML = `\\[ \\text{Error: ${err.message}} \\]`;
    if (window.MathJax) {
      window.MathJax.typesetPromise([displayEl]);
    }
  }
}

// ============================================================================
// SECTION 2: THE SIMPLIFIED PARSER (NOW WITH EXPONENTS!)
// ============================================================================

// LEVEL 1: Handles Addition and Subtraction
function parseExpression() {
  let expr = parseTerm(); 

  while (peek() === '+' || peek() === '-') {
    let opToken = consume(); 
    let nextTower = parseTerm(); 

    if (opToken === '+') {
      expr = executeAddition(expr, nextTower);
    } else if (opToken === '-') {
      expr = executeSubtraction(expr, nextTower);
    }
  }

  return expr;
}

// LEVEL 2: Handles Multiplication and Division
function parseTerm() {
  // 1. UPDATED: We now check for Exponents BEFORE we multiply or divide!
  let expr = parsePower();

  while (peek() === '*' || peek() === '/') {
    let opToken = consume(); 
    let nextTower = parsePower(); 

    if (opToken === '*') {
      expr = executeMultiplication(expr, nextTower);
    } else if (opToken === '/') {
      expr = executeDivision(expr, nextTower);
    }
  }

  return expr;
}

// LEVEL 2.5: NEW! Handles Exponents
function parsePower() {
  // Go one level deeper to grab the number or parentheses first
  let expr = parseFactor();

  // Keep reading as long as there is a '^' symbol
  while (peek() === '^') {
    consume(); // Eat the '^' token
    let nextTower = parseFactor(); // Grab the next number
    expr = executeExponentiation(expr, nextTower);
  }

  return expr;
}

// LEVEL 3: Grabs raw numbers OR intercepts Parentheses
function parseFactor() {
  if (peek() === '(') {
    consume(); 
    let insideExpr = parseExpression(); 
    
    if (peek() !== ')') {
      throw new Error("Missing closing parenthesis ')'");
    }
    consume(); 
    return insideExpr; 
  }

  let token = consume();
  if (!token) {
    throw new Error("Missing number or expression!");
  }
  
  if (isNaN(parseFloat(token))) {
    throw new Error("Unexpected token: " + token);
  }
  
  return createTower(parseFloat(token));
}

// ============================================================================
// TOWER ARITHMETIC UTILITIES
// ============================================================================

function createTower(val, heights = [0, 0]) {
  return { value: val, heights: [...heights] };
}

function executeAddition(A, B) {
  let heightA = A.heights[0] + A.heights[1];
  let heightB = B.heights[0] + B.heights[1];
  if (heightA === 0 && heightB === 0) {
    return createTower(A.value + B.value);
  } else {
    return heightA >= heightB ? A : B;
  }
}

function executeSubtraction(A, B) {
  let heightA = A.heights[0] + A.heights[1];
  let heightB = B.heights[0] + B.heights[1];
  if (heightA === 0 && heightB === 0) {
    return createTower(A.value - B.value);
  } else {
    return A; 
  }
}

function executeMultiplication(A, B) {
  let heightA = A.heights[0] + A.heights[1];
  let heightB = B.heights[0] + B.heights[1];
  if (heightA === 0 && heightB === 0) {
    return createTower(A.value * B.value);
  } else {
    return heightA >= heightB ? A : B; 
  }
}

function executeDivision(A, B) {
  let heightA = A.heights[0] + A.heights[1];
  let heightB = B.heights[0] + B.heights[1];
  if (heightA === 0 && heightB === 0) {
    if (B.value === 0) throw new Error("Cannot divide by zero!");
    return createTower(A.value / B.value);
  } else {
    return A; 
  }
}

// NEW: Clean Exponentiation Function
function executeExponentiation(A, B) {
  let heightA = A.heights[0] + A.heights[1];
  let heightB = B.heights[0] + B.heights[1];
  
  // IF IT'S IN HEIGHT 0: Standard exponents
  if (heightA === 0 && heightB === 0) {
    return createTower(Math.pow(A.value, B.value));
  } else {
    // If working with massive numbers, the larger tower absorbs the smaller one
    return heightA >= heightB ? A : B; 
  }
}

// ============================================================================
// SECTION 3: DISPLAY ROUTER & RENDERMATH BRIDGE
// ============================================================================

function formatTower(displayElement, current) {
  if (isNaN(current.value)) {
    renderMath(displayElement, "\\text{Undefined}");
    return;
  }
  
  let expCount = current.heights[0];
  let val = current.value;

  // 1. Build the base layout string
  let latex = val.toString();
  if (Math.abs(val) >= 1e6) {
    let exp = Math.floor(Math.log10(Math.abs(val)));
    let coeff = val / Math.pow(10, exp);
    latex = `${coeff.toFixed(4)} \\times 10^{${exp}}`;
  }

  // 2. Wrap it if exponent layers are active
  if (expCount > 0) {
    if (expCount < 5) {
      for (let i = 0; i < expCount; i++) {
        latex = `10^{${latex}}`;
      }
    } else {
      latex = `10 \\uparrow\\uparrow {${expCount}} > {${latex}}`;
    }
  }

  // 3. Fire your required render math engine
  renderMath(displayElement, latex);
}

// Fallback safety utility for Section 4 rendering
function renderMath(element, latexString) {
  element.innerHTML = `\\[ ${latexString} \\]`;
  if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
    window.MathJax.typesetPromise([element]);
  }
}

// ===================================================================
// WEBSITE STUFF ARCHIVE
// ===================================================================

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
