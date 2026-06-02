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
// SECTION 2: THE SIMPLIFIED PARSER & MATH BRAIN (WITH BYPASS & GAMMA)
// ============================================================================

// Lanczos Coefficients for high-precision Gamma calculation
const LANCZOS_G = 7;
const LANCZOS_P = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
];

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

// LEVEL 2.5: Handles Exponents
function parsePower() {
  // Go to postfix first to see if there's a trailing factorial!
  let expr = parsePostfix(); 

  while (peek() === '^') {
    consume(); 
    let nextTower = parsePostfix(); 
    expr = executeExponentiation(expr, nextTower);
  }

  return expr;
}

// LEVEL 2.7: NEW! Postfix Operations (Handles Trailing Factorials like 5!)
function parsePostfix() {
  let expr = parseFactor();

  while (peek() === '!') {
    consume(); // Eat the '!' token
    expr = executeFactorial(expr);
  }

  return expr;
}

// LEVEL 3: Grabs numbers, Parentheses, Functions, or Constants
function parseFactor() {
  if (peek() === '(') {
    consume(); 
    let insideExpr = parseExpression(); 
    if (peek() !== ')') throw new Error("Missing closing parenthesis ')'");
    consume(); 
    return insideExpr; 
  }

  if (peek() === 'sin' || peek() === 'cos' || peek() === 'tan') {
    let trigOp = consume(); 
    if (peek() !== '(') throw new Error(`${trigOp} must be followed by '('`);
    consume(); 
    let arg = parseExpression();
    if (peek() !== ')') throw new Error(`Missing closing parenthesis in ${trigOp}`);
    consume(); 
    return executeTrig(trigOp, arg);
  }

  // NEW: Gamma Function Interceptor (Supports both Capital Γ and lowercase γ)
  if (peek() === 'Γ' || peek() === 'γ') {
    let op = consume();
    if (peek() !== '(') throw new Error(`${op} function must be followed by '('`);
    consume();
    let arg = parseExpression();
    if (peek() !== ')') throw new Error(`Missing closing parenthesis in ${op}`);
    consume();
    return executeGamma(arg);
  }

  if (peek() === 'π') { consume(); return createTower(Math.PI); }
  if (peek() === 'e') { consume(); return createTower(Math.E); }
  if (peek() === 'ϕ') { consume(); return createTower(PHI); }

  if (peek() === '√') {
    consume(); 
    if (peek() === '(') {
      consume(); 
      let arg1 = parseExpression();
      if (peek() === ',') {
        consume(); 
        let arg2 = parseExpression();
        if (peek() !== ')') throw new Error("Missing closing parenthesis in root");
        consume(); 
        return executeRoot(arg1, arg2); 
      } else {
        if (peek() !== ')') throw new Error("Missing closing parenthesis in root");
        consume(); 
        return executeRoot(createTower(2), arg1); 
      }
    } else {
      let arg = parseFactor();
      return executeRoot(createTower(2), arg);
    }
  }

  if (peek() === 'log') {
    consume(); 
    if (peek() !== '(') throw new Error("log must be followed by '('");
    consume(); 
    let arg1 = parseExpression();
    if (peek() === ',') {
      consume(); 
      let arg2 = parseExpression();
      if (peek() !== ')') throw new Error("Missing closing parenthesis in log");
      consume(); 
      return executeLog(arg1, arg2); 
    } else {
      if (peek() !== ')') throw new Error("Missing closing parenthesis in log");
      consume(); 
      return executeLog(createTower(10), arg1);
    }
  }

  if (peek() === 'ln') {
    consume(); 
    if (peek() !== '(') throw new Error("ln must be followed by '('");
    consume(); 
    let arg = parseExpression();
    if (peek() !== ')') throw new Error("Missing closing parenthesis in ln");
    consume(); 
    return executeLn(arg);
  }

  let token = consume();
  if (!token) throw new Error("Missing number or expression!");
  if (isNaN(parseFloat(token))) throw new Error("Unexpected token: " + token);
  
  return createTower(parseFloat(token));
}

// ============================================================================
// HARDWARE PROCESSING & BYPASS ENGINE UTILITIES
// ============================================================================

function createTower(val, heights = [0, 0]) {
  return { value: val, heights: [...heights] };
}

// Internal raw calculator loop for Gamma calculations
function rawLanczosGamma(z) {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * rawLanczosGamma(1 - z));
  z -= 1;
  let x = LANCZOS_P[0];
  for (let i = 1; i < LANCZOS_P.length; i++) x += LANCZOS_P[i] / (z + i);
  let t = z + LANCZOS_G + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

// UPGRADED: Exponentiation with Automatic Floating-Point Bypass Protection!
function executeExponentiation(A, B) {
  let hA = A.heights[0] + A.heights[1];
  let hB = B.heights[0] + B.heights[1];

  if (hA === 0 && hB === 0) {
    // If the calculation will breach ~10^300 limit, intercept and convert to a tower layout!
    if (A.value > 0 && B.value * Math.log10(A.value) > 300) {
      let towerExponent = B.value * Math.log10(A.value);
      return createTower(towerExponent, [1, 0]); // Moves the number safely out of standard JS limits
    }
    return createTower(Math.pow(A.value, B.value));
  }
  
  if (hB > 0) return B;
  if (hA > 0) return createTower(A.value + Math.log10(B.value), [A.heights[0], A.heights[1]]);
  return hA >= hB ? A : B;
}

// NEW: Crash-proof Factorial Processing Engine (with Stirling large-scale bypass)
function executeFactorial(A) {
  if (A.heights[0] + A.heights[1] > 0) return A; 
  let val = A.value;

  // CRASH CONTROL: Factorials are mathematically undefined for negative integers
  if (val < 0 && Number.isInteger(val)) {
    throw new Error("Factorial is undefined for negative integers!");
  }

  // BYPASS ACTIVE: Anything over 170! breaks standard computers. We switch to Stirling log limits!
  if (val > 170) {
    let logScale = 0.5 * Math.log10(2 * Math.PI * val) + val * Math.log10(val / Math.E);
    return createTower(logScale, [1, 0]);
  }

  // x! = Γ(x + 1)
  return createTower(rawLanczosGamma(val + 1));
}

// NEW: Crash-proof Gamma Function Processing Engine
function executeGamma(A) {
  if (A.heights[0] + A.heights[1] > 0) return A;
  let val = A.value;

  // CRASH CONTROL: Gamma is mathematically undefined for zero and negative integers
  if (val <= 0 && Number.isInteger(val)) {
    throw new Error("Gamma function is undefined for non-positive integers!");
  }

  // BYPASS ACTIVE: If the parameter scales past standard floating bounds, use log towers
  if (val > 171) {
    let n = val - 1;
    let logScale = 0.5 * Math.log10(2 * Math.PI * n) + n * Math.log10(n / Math.E);
    return createTower(logScale, [1, 0]);
  }

  return createTower(rawLanczosGamma(val));
}

// Standard operations framework
function executeAddition(A, B) {
  let hA = A.heights[0] + A.heights[1];
  let hB = B.heights[0] + B.heights[1];
  return (hA === 0 && hB === 0) ? createTower(A.value + B.value) : (hA >= hB ? A : B);
}
function executeSubtraction(A, B) {
  let hA = A.heights[0] + A.heights[1];
  let hB = B.heights[0] + B.heights[1];
  return (hA === 0 && hB === 0) ? createTower(A.value - B.value) : A;
}
function executeMultiplication(A, B) {
  let hA = A.heights[0] + A.heights[1];
  let hB = B.heights[0] + B.heights[1];
  return (hA === 0 && hB === 0) ? createTower(A.value * B.value) : (hA >= hB ? A : B);
}
function executeDivision(A, B) {
  let hA = A.heights[0] + A.heights[1];
  let hB = B.heights[0] + B.heights[1];
  if (hA === 0 && hB === 0) {
    if (B.value === 0) throw new Error("Cannot divide by zero!");
    return createTower(A.value / B.value);
  }
  return A;
}
function executeRoot(degree, rad) {
  let hDeg = degree.heights[0] + degree.heights[1];
  let hRad = rad.heights[0] + rad.heights[1];
  if (hDeg === 0 && hRad === 0) {
    if (degree.value === 0) throw new Error("Root degree cannot be zero!");
    return createTower(Math.pow(rad.value, 1 / degree.value));
  }
  return rad;
}
function executeLog(base, arg) {
  let hBase = base.heights[0] + base.heights[1];
  let hArg = arg.heights[0] + arg.heights[1];
  if (hBase === 0 && hArg === 0) {
    if (base.value <= 0 || base.value === 1) throw new Error("Invalid log base");
    if (arg.value <= 0) throw new Error("Log parameter must be greater than 0");
    if (base.value === 10) return createTower(Math.log10(arg.value));
    return createTower(Math.log(arg.value) / Math.log(base.value));
  }
  return arg;
}
function executeLn(arg) {
  let hArg = arg.heights[0] + arg.heights[1];
  if (hArg === 0) {
    if (arg.value <= 0) throw new Error("ln parameter must be greater than 0");
    return createTower(Math.log(arg.value));
  }
  return arg;
}
function executeTrig(type, target) {
  let hTarget = target.heights[0] + target.heights[1];
  if (hTarget === 0) {
    let result = 0;
    if (type === 'sin') result = Math.sin(target.value);
    if (type === 'cos') result = Math.cos(target.value);
    if (type === 'tan') result = Math.tan(target.value);
    if (Math.abs(result) < 1e-15) result = 0;
    if (type === 'tan' && Math.abs(result) > 1e15) throw new Error("Tangent is undefined (Asymptote reached!)");
    return createTower(result);
  }
  return createTower(NaN); 
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
