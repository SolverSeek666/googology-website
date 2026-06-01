// I use gemini to help me lmao

// ============================================================================
// SECTION 1: SETUP & INPUT (UNIFIED & FIXED)
// ============================================================================

const PHI = (1 + Math.sqrt(5)) / 2;

// 1. Tokenizer: Breaks text into readable pieces
function tokenize(input) {
  // Matches numbers (like 10 or 5) or operators (+ or -)
  let regex = /\d+|\+|-/g;
  let matches = input.match(regex) || [];
  
  // Convert matches into clean token objects
  return matches.map(token => {
    if (token === '+' || token === '-') {
      return { type: 'OPERATOR', value: token };
    } else {
      return { type: 'NUMBER', value: parseFloat(token) };
    }
  });
}

// 2. Parser: Evaluates the tokens left-to-right
function parseExpression(input) {
  let tokens = tokenize(input);
  if (tokens.length === 0) return createTower(0);

  // Start with the very first number as our base expression (expr)
  let expr = createTower(tokens[0].value);

  // Loop through the rest of the tokens two at a time (Operator + Number)
  for (let i = 1; i < tokens.length; i += 2) {
    let operator = tokens[i];
    let nextNumber = tokens[i + 1];

    if (!operator || !nextNumber) break;

    let nextTower = createTower(nextNumber.value);

    // Check the operator token and run the clean math functions
    if (operator.value === '+') {
      expr = executeAddition(expr, nextTower);
    } else if (operator.value === '-') {
      expr = executeSubtraction(expr, nextTower);
    }
  }

  return expr; // Returns the final structural tower
}

// ============================================================================
// SECTION 2: THE MATH BRAIN (ROBUST PARSER ENGINE)
// Uses a Recursive Descent Parser to enforce true mathematical precedence.
// ============================================================================

// Helper to create our simple 2-slot tower tracker
function createTower(val, heights = [0, 0]) {
  return { value: val, heights: [...heights] };
}

// Clean Addition Function
function executeAddition(A, B) {
  let heightA = A.heights[0] + A.heights[1];
  let heightB = B.heights[0] + B.heights[1];

  // IF IT'S IN HEIGHT 0: Just add the standard numbers!
  if (heightA === 0 && heightB === 0) {
    return createTower(A.value + B.value);
  } 
  // ELSE: The giant tower swallows the small number
  else {
    return heightA >= heightB ? A : B;
  }
}

// Clean Subtraction Function
function executeSubtraction(A, B) {
  let heightA = A.heights[0] + A.heights[1];
  let heightB = B.heights[0] + B.heights[1];

  // IF IT'S IN HEIGHT 0: Just subtract the standard numbers!
  if (heightA === 0 && heightB === 0) {
    return createTower(A.value - B.value);
  } 
  // ELSE: Subtracting a small number from a giant tower changes nothing
  else {
    return A; 
  }
}

// ============================================================================
// SECTION 2.5: TOWER ARITHMETIC UTILITIES
// Handles interactions between high towers and low mathematical numbers.
// ============================================================================

// ============================================================================
// SECTION 3: DISPLAY FORMATTING ROUTER (AUTOMATIC TETRATION STACKER)
// ============================================================================

function formatTower(current) {
  if (isNaN(current.value)) return "\\text{Undefined}";
  
  let expCount = current.heights[0];
  let tetCount = current.heights[1];
  let val = current.value;

  // 1. Format the base number first
  let latex = val.toString();
  if (Math.abs(val) >= 1e6) {
    let exp = Math.floor(Math.log10(Math.abs(val)));
    let coeff = val / Math.pow(10, exp);
    latex = `${coeff.toFixed(4)} \\times 10^{${exp}}`;
  }

  // 2. Wrap it in exponent layers if they exist
  if (expCount > 0) {
    if (expCount < 5) {
      for (let i = 0; i < expCount; i++) {
        latex = `10^{${latex}}`;
      }
    } else {
      latex = `10 \\uparrow\\uparrow {${expCount}} > {${latex}}`;
    }
  }

  return latex;
}

// ============================================================================
// SECTION 4: THE OUTPUT RENDERING
// ============================================================================

function updateDisplay(inputString, displayElement) {
  // Step 1: Parse the string into our simple engine
  let finalExpr = parseExpression(inputString);
  
  // Step 2: Convert the results into LaTeX format
  let latexOutput = formatTower(finalExpr);
  
  // Step 3: Render it to the screen using Section 4 standard
  renderMath(displayElement, latexOutput);
}

// ===================================================================
// WEBSITE STUFF ARCHIVE
// These stuff are preserved for archival purposes.
// ===================================================================

// I resetted the calculator. for some reason.

// 1. The Forward Stack: Computes n * e^(n * e^(n...)) for height k
function lambertStack(k, n) {
  if (k === 1) return n;
  return n * Math.exp(lambertStack(k - 1, n));
}

// 2. The Extended Lambert W Solver (Binary Search)
// Solves for n where lambertStack(k, n) = a
function extendedLambertW(k, a) {
  if (a <= 0) return NaN; // Real numbers only for this calculator
  
  let low = 0;
  let high = Math.max(1, Math.log(a) + 1); // Safe upper bound
  let mid, guess;
  
  // 60 iterations provides extreme floating-point precision
  for (let i = 0; i < 60; i++) {
    mid = (low + high) / 2;
    guess = lambertStack(k, mid);
    
    if (guess === a) break;
    if (guess < a) low = mid;
    else high = mid;
  }
  return mid;
}

// 3. The Super-Root Function using your exact W(k, ln(a)) logic!
// Finds x where x^^k = a
function superRoot(k, a) {
  if (k === 1) return a;
  // x = e^W(k, ln(a))
  let wVal = extendedLambertW(k, Math.log(a));
  return Math.exp(wVal);
}
