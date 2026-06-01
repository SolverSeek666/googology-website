// I use gemini to help me lmao

const PHI = (1 + Math.sqrt(5)) / 2;

// ============================================================================
// SECTION 1: PARSER ENGINE (TOKENS & EXPRESSIONS)
// ============================================================================

// 1. Tokenizer: Breaks text into readable pieces (now supports decimals too!)
function tokenize(input) {
  let regex = /\d+\.\d+|\d+|\+|-/g;
  let matches = input.match(regex) || [];
  
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

  let expr = createTower(tokens[0].value);

  for (let i = 1; i < tokens.length; i += 2) {
    let operator = tokens[i];
    let nextNumber = tokens[i + 1];

    if (!operator || !nextNumber) break;

    let nextTower = createTower(nextNumber.value);

    if (operator.value === '+') {
      expr = executeAddition(expr, nextTower);
    } else if (operator.value === '-') {
      expr = executeSubtraction(expr, nextTower);
    }
  }

  return expr;
}

// ============================================================================
// SECTION 2: THE MATH BRAIN
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

// ============================================================================
// SECTION 3: DISPLAY FORMATTING ROUTER
// ============================================================================

function formatTower(current) {
  if (isNaN(current.value)) return "\\text{Undefined}";
  
  let expCount = current.heights[0];
  let val = current.value;

  let latex = val.toString();
  if (Math.abs(val) >= 1e6) {
    let exp = Math.floor(Math.log10(Math.abs(val)));
    let coeff = val / Math.pow(10, exp);
    latex = `${coeff.toFixed(4)} \\times 10^{${exp}}`;
  }

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
// SECTION 4: THE OUTPUT RENDERING BRIDGE (WITH SAFETIES)
// ============================================================================

function updateDisplay(inputString, displayElement) {
  let finalExpr = parseExpression(inputString);
  let latexOutput = formatTower(finalExpr);
  
  // Safety Check: If renderMath function doesn't exist yet, fall back to plain text
  if (typeof renderMath === "function") {
    renderMath(displayElement, latexOutput);
  } else {
    displayElement.innerHTML = `$$${latexOutput}$$ (Raw Text Fallback)`;
  }
}

// ============================================================================
// SECTION 5: SAFE INITIALIZATION BLOCK
// ============================================================================

function initializeCalculator() {
  let inputBox = document.getElementById("calculatorInput");
  let displayBox = document.getElementById("mathDisplay");

  if (inputBox && displayBox) {
    // Listen for the Enter key
    inputBox.addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        updateDisplay(inputBox.value, displayBox);
      }
    });
    console.log("Calculator engine successfully linked to HTML fields.");
  } else {
    console.error("Initialization failed: Check if your HTML elements use id='calculatorInput' and id='mathDisplay'!");
  }
}

// Runs immediately if page is already cooked, otherwise waits for the trigger
if (document.readyState === "complete" || document.readyState === "interactive") {
  initializeCalculator();
} else {
  document.addEventListener("DOMContentLoaded", initializeCalculator);
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
