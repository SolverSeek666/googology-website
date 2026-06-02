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
// SECTION 2: THE SIMPLIFIED PARSER & MATH BRAIN (WITH FUNCTIONS)
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
  let expr = parseFactor();

  while (peek() === '^') {
    consume(); 
    let nextTower = parseFactor(); 
    expr = executeExponentiation(expr, nextTower);
  }

  return expr;
}

// LEVEL 3: Grabs numbers, Parentheses, or intercept Functions!
function parseFactor() {
  // 1. STANDARD PARENTHESES
  if (peek() === '(') {
    consume(); 
    let insideExpr = parseExpression(); 
    if (peek() !== ')') throw new Error("Missing closing parenthesis ')'");
    consume(); 
    return insideExpr; 
  }

  // 2. ROOTS: Handles √a AND √(a,b)
  if (peek() === '√') {
    consume(); // Eat the '√'
    
    if (peek() === '(') {
      consume(); // Eat the '('
      let arg1 = parseExpression();
      
      // If there's a comma, it's a custom root degree like √(3,8)
      if (peek() === ',') {
        consume(); // Eat the ','
        let arg2 = parseExpression();
        if (peek() !== ')') throw new Error("Missing closing parenthesis in root");
        consume(); // Eat the ')'
        return executeRoot(arg1, arg2); // arg1-th root of arg2
      } else {
        // No comma means standard square root written like √(a)
        if (peek() !== ')') throw new Error("Missing closing parenthesis in root");
        consume(); // Eat the ')'
        return executeRoot(createTower(2), arg1); 
      }
    } else {
      // Allows simple typing without brackets like: √4
      let arg = parseFactor();
      return executeRoot(createTower(2), arg);
    }
  }

  // 3. LOGARITHMS: Handles log(a) AND log(a,b)
  if (peek() === 'log') {
    consume(); // Eat 'log'
    if (peek() !== '(') throw new Error("log must be followed by '('");
    consume(); // Eat '('
    
    let arg1 = parseExpression();
    
    // If there's a comma, it's a custom base like log(2,8)
    if (peek() === ',') {
      consume(); // Eat the ','
      let arg2 = parseExpression();
      if (peek() !== ')') throw new Error("Missing closing parenthesis in log");
      consume(); // Eat the ')'
      return executeLog(arg1, arg2); // log base arg1 of arg2
    } else {
      // No comma means standard base-10 log written like log(a)
      if (peek() !== ')') throw new Error("Missing closing parenthesis in log");
      consume(); // Eat the ')'
      return executeLog(createTower(10), arg1);
    }
  }

  // 4. NATURAL LOGARITHM: Handles ln(a)
  if (peek() === 'ln') {
    consume(); // Eat 'ln'
    if (peek() !== '(') throw new Error("ln must be followed by '('");
    consume(); // Eat '('
    
    let arg = parseExpression();
    if (peek() !== ')') throw new Error("Missing closing parenthesis in ln");
    consume(); // Eat the ')'
    return executeLn(arg);
  }

  // FALLBACK TO BASIC NUMBERS
  let token = consume();
  if (!token) throw new Error("Missing number or expression!");
  if (isNaN(parseFloat(token))) throw new Error("Unexpected token: " + token);
  
  return createTower(parseFloat(token));
}

// ============================================================================
// TOWER ARITHMETIC UTILITIES (THE CALCULATOR PROCESSING BRAIN)
// ============================================================================

function createTower(val, heights = [0, 0]) {
  return { value: val, heights: [...heights] };
}

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

function executeExponentiation(A, B) {
  let hA = A.heights[0] + A.heights[1];
  let hB = B.heights[0] + B.heights[1];
  return (hA === 0 && hB === 0) ? createTower(Math.pow(A.value, B.value)) : (hA >= hB ? A : B);
}

// NEW: Root Processing Block
function executeRoot(degree, rad) {
  let hDeg = degree.heights[0] + degree.heights[1];
  let hRad = rad.heights[0] + rad.heights[1];
  
  if (hDeg === 0 && hRad === 0) {
    if (degree.value === 0) throw new Error("Root degree cannot be zero!");
    // b^(1/a) calculation rule
    return createTower(Math.pow(rad.value, 1 / degree.value));
  }
  return rad; // Huge tower fallback rule
}

// NEW: Logarithm Processing Block
function executeLog(base, arg) {
  let hBase = base.heights[0] + base.heights[1];
  let hArg = arg.heights[0] + arg.heights[1];
  
  if (hBase === 0 && hArg === 0) {
    if (base.value <= 0 || base.value === 1) throw new Error("Invalid log base");
    if (arg.value <= 0) throw new Error("Log parameter must be greater than 0");
    return createTower(Math.log(arg.value) / Math.log(base.value));
  }
  return arg; // Huge tower fallback rule
}

// NEW: Natural Log Processing Block
function executeLn(arg) {
  let hArg = arg.heights[0] + arg.heights[1];
  
  if (hArg === 0) {
    if (arg.value <= 0) throw new Error("ln parameter must be greater than 0");
    return createTower(Math.log(arg.value));
  }
  return arg; // Huge tower fallback rule
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
