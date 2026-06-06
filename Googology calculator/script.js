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
// SECTION 2: THE PARSER ENGINE (NOW WITH SEAMLESS TETRATION PRECEDENCE)
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
  // ROUTING FIX: Now points to parseTetration instead of parsePower
  let expr = parseTetration();

  while (peek() === '*' || peek() === '/') {
    let opToken = consume(); 
    let nextTower = parseTetration(); // ROUTING FIX: Points to parseTetration

    if (opToken === '*') {
      expr = executeMultiplication(expr, nextTower);
    } else if (opToken === '/') {
      expr = executeDivision(expr, nextTower);
    }
  }

  return expr;
}

// LEVEL 2.25: Handles Tetration (Right-Associative)
function parseTetration() {
  let node = parsePower(); // FIXED: Now evaluates Powers tighter than Tetration
  if (match('^^')) {
    let right = parseTetration(); 
    let barrier = createTower(1, 0);
    if (match('>')) {
      // Grab the entire remaining expression as the barrier block
      barrier = parseExpression();
    }
    node = executeTetration(node, right, barrier);
  }
  return node;
}

// LEVEL 2.5: Handles Exponents (Right-Associative)
function parsePower() {
  let expr = parsePostfix(); 

  if (peek() === '^') {
    consume(); 
    let nextTower = parsePower(); 
    expr = executeExponentiation(expr, nextTower);
  }

  return expr;
}

// LEVEL 2.7: Postfix Handler for Factorials
function parsePostfix() {
  let expr = parseFactor();

  while (peek() === '!') {
    consume(); 
    expr = executeFactorial(expr);
  }

  return expr;
}

// LEVEL 3: Base Factors, Parentheses, Functions, and Constants
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

  if (peek() === 'Γ' || peek() === 'γ') {
    let gammaOp = consume();
    if (peek() !== '(') throw new Error(`${gammaOp} must be followed by '('`);
    consume();

    let arg = parseExpression();
    if (peek() !== ')') throw new Error(`Missing closing parenthesis in ${gammaOp}`);
    consume();

    return executeGamma(arg);
  }

  if (peek() === 'π') {
    consume();
    return createTower(Math.PI);
  }
  if (peek() === 'e') {
    consume();
    return createTower(Math.E);
  }
  if (peek() === 'ϕ') {
    consume();
    return createTower(PHI); 
  }

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
// TOWER ARITHMETIC UTILITIES (BRACKETLESS ENGINE)
// ============================================================================

// Clean primitive setup
function createTower(val, height = 0) {
  return { value: val, height: height };
}

// Creates a Tetration object: 10^^b > a
function createTetration(value, height) {
  return {
    type: "tetration",
    value: value,
    height: height
  };
}

// Skeleton for the future Arrow expansion: 10^...^a with c arrows, height b
function createArrow(a, b, c) {
  return {
    type: "arrow",
    value: a,
    height: b,
    arrows: c
  };
}

// Canonicalizer now works with direct numbers instead of array elements
function canonicalize(val, h) {
  if (isNaN(val)) return createTower(NaN, 0);
  if (val === Infinity) return createTower(Infinity, 0);

  // 1. UNIFORM UPWARD EVOLUTION: Only climb a tier if value hits 10^10
  while (true) {
    if (val >= 1e10 && isFinite(val)) {
      val = Math.log10(val);
      h++;
    } else {
      break;
    }
  }

  // 2. UNIFORM DOWNWARD DEVOLUTION: Pull down any tier whose value drops below 10
  while (true) {
    if (h > 0) {
      if (val < 10) {
        val = Math.pow(10, val);
        h--;
      } else {
        break;
      }
    } else { 
      break;
    }
  }

  // Precision snap to eliminate floating-point crumbs on clean integers
  if (h >= 1 && Math.abs(val - Math.round(val)) < 1e-12) {
    val = Math.round(val);
  }

  return createTower(val, h);
}

function executeGamma(A) {
  let hA = A.height;
  if (hA > 0) return createTower(A.value, A.height + 1);

  let val = A.value;
  if (val === Infinity) return createTower(Infinity);
  if (val === 0 || (val < 0 && Number.isInteger(val))) {
    throw new Error("Gamma function is undefined for non-positive integers!");
  }
  if (val === 1 || val === 2) return createTower(1);
  
  if (val <= 171 && Number.isInteger(val) && val > 0) {
    let g = 1;
    for (let i = 2; i < val; i++) g *= i;
    return createTower(g);
  }
  
  let shift = 0;
  let shiftFactor = 1;
  let shiftedVal = val;
  
  while (shiftedVal < 10) {
    shiftFactor *= shiftedVal;
    shiftedVal += 1;
    shift++;
  }
  
  let log10Gamma = (shiftedVal - 0.5) * Math.log10(shiftedVal) - shiftedVal * Math.LOG10E + 0.5 * Math.log10(2 * Math.PI);
  if (shift > 0) log10Gamma -= Math.log10(shiftFactor);
  
  if (log10Gamma < 300) return createTower(Math.pow(10, log10Gamma));
  return canonicalize(log10Gamma, 1);
}

function executeFactorial(A) {
  if (A.height > 0) return createTower(A.value, A.height + 1);
  if (A.value < 0 && Number.isInteger(A.value)) throw new Error("Factorial undefined for negative integers!");
  return executeGamma(createTower(A.value + 1));
}

function executeAddition(A, B) {
  return (A.height === 0 && B.height === 0) ? canonicalize(A.value + B.value, 0) : (A.height >= B.height ? A : B);
}

function executeSubtraction(A, B) {
  return (A.height === 0 && B.height === 0) ? canonicalize(A.value - B.value, 0) : A;
}

function executeMultiplication(A, B) {
  return (A.height === 0 && B.height === 0) ? canonicalize(A.value * B.value, 0) : (A.height >= B.height ? A : B);
}

function executeDivision(A, B) {
  if (A.height === 0 && B.height === 0) {
    if (B.value === 0) throw new Error("Cannot divide by zero!");
    return canonicalize(A.value / B.value, 0);
  }
  return A;
}

function executeExponentiation(A, B) {
  let hA = A.height;
  let hB = B.height;

  if (A.value === 0 && B.value === 0) return createTower(NaN, 0);
  if (A.value === 0) return createTower(0, 0);
  if (B.value === 0) return createTower(1, 0);

  // CASE 1: Ground level standard powers
  if (hA === 0 && hB === 0) {
    if (A.value > 0) {
      let log10Result = B.value * Math.log10(A.value);
      if (log10Result >= 10) return canonicalize(log10Result, 1);
    }
    return canonicalize(Math.pow(A.value, B.value), 0);
  }

  // CASE 2: Base is tower, Exponent is real number
  if (hA > 0 && hB === 0) {
    if (B.value === 1) return A;
    if (hA === 1) return canonicalize(A.value * B.value, 1);
    if (hA === 2) return canonicalize(A.value + Math.log10(B.value), 2);
    if (hA === 3) {
      let Y = (A.value > 15) ? A.value : Math.log10(Math.pow(10, A.value) + Math.log10(B.value));
      return canonicalize(Y, 3);
    }
    return A;
  }

  // CASE 3: Base is real number, Exponent is tower
  if (hA === 0 && hB > 0) {
    if (A.value <= 0 || A.value === 1) return createTower(1, 0);
    let logLogA = Math.log10(Math.log10(A.value));
    if (hB === 1) return canonicalize(B.value + logLogA, 2);
    if (hB === 2) {
      let Y = (B.value > 15) ? B.value : Math.log10(Math.pow(10, B.value) + logLogA);
      return canonicalize(Y, 3);
    }
    return canonicalize(B.value, hB + 1);
  }

  // CASE 4: Active Tower vs Active Tower
  if (hA > 0 && hB > 0) {
    if (hB >= hA) return canonicalize(B.value, hB + 1);
    if (hA === 2 && hB === 1) return canonicalize(A.value + B.value, 2);
    if (hA === 3 && hB === 1) {
      let Y = (A.value > 15) ? A.value : Math.log10(Math.pow(10, A.value) + B.value);
      return canonicalize(Y, 3);
    }
    return A;
  }

  return hA >= hB ? A : B;
}

function executeTetration(A, B, Barrier) {
  // Case 0: INFINITY / NaN checks
  if (isNaN(A.value) || isNaN(B.value) || isNaN(Barrier.value)) return createTower(NaN, 0);
  if (B.value === Infinity || A.value === Infinity) return createTower(Infinity, 0);
  
  // FIXED: Check if the height B is itself an ultra-giant tower structure
  let isBTower = (typeof B.height === 'object' && B.height !== null) || (typeof B.height === 'number' && B.height >= 1);

  // ==========================================
  // FIX: ZERO HEIGHT EDGE-CASE INTERCEPTOR
  // Tetration to a height of 0 simply returns the baseline barrier
  // ==========================================
  if (!isBTower && B.value === 0) {
    return Barrier;
  }
  // ==========================================

  // ==========================================
  // PURE LINEAR FRACTIONAL TETRATION INTERCEPTOR
  // Ensures a perfectly smooth, unbroken curve for all decimals
  // ==========================================
  if (A.height === 0 && B.height === 0 && !Number.isInteger(B.value)) {
    let base = A.value;
    let exponent = B.value;
    if (exponent < 0) return createTower(NaN, 0);

    let intPart = Math.floor(exponent);
    let fracPart = exponent - intPart;
    
    // Pure Linear Approximation Baseline (x^^fracPart = base^fracPart)
    let fracResult = Math.pow(base, fracPart);

    // Pass the fractional boundary safely into your integer tower engine
    let newB = createTower(intPart, 0);
    let newBarrier = createTower(fracResult, 0);
    
    return executeTetration(A, newB, newBarrier); // Fixed computeTetration typo
  }
  // ==========================================
  
  // Case 1: Base A is already a giant tower (height >= 1)
  if (A.height >= 1) {
    if (!isBTower) {
      let y = B.value;
      let bVal = Barrier.value;
      let bHeight = Barrier.height;

      // Handle trivial barrier (Barrier = 1) normally
      if (bHeight === 0 && bVal === 1) {
        if (y === 1) return A;
      }

      if (A.height === 1) {
        if (bHeight === 0) {
          if (y === 1) {
            return createTower(A.value * bVal, 1);
          } else {
            let topVal = A.value * bVal;
            if (A.value > 0) topVal += Math.log10(A.value);
            return createTower(topVal, y);
          }
        } else {
          return createTower(bVal, bHeight + y);
        }
      } else if (A.height === 2) {
        if (bHeight === 0) {
          if (y === 1) {
            let topVal = A.value;
            if (bVal > 0) topVal += Math.log10(bVal);
            return createTower(topVal, 2);
          } else {
            if (A.value <= 308) {
              let topVal = A.value + bVal * Math.pow(10, A.value);
              return createTower(topVal, y);
            } else {
              let topVal = A.value;
              if (bVal > 0) topVal += Math.log10(bVal);
              return createTower(topVal, y + 1);
            }
          }
        } else {
          return createTower(bVal, bHeight + y);
        }
      } else if (A.height === 3) {
        if (bHeight === 0) {
          if (y === 1) {
            if (A.value <= 308) {
              let topVal = Math.pow(10, A.value) + Math.log10(bVal);
              return createTower(topVal, 3);
            } else {
              return createTower(A.value, 3);
            }
          } else {
            return createTower(A.value, y + 2);
          }
        } else {
          return createTower(bVal, bHeight + y);
        }
      } else {
        // Base is a height-4+ tower
        if (bHeight === 0) {
          if (y === 1) {
            return createTower(A.value, A.height);
          } else {
            return createTower(A.value, A.height + y - 1);
          }
        } else {
          return createTower(bVal, bHeight + y);
        }
      }
    } else {
      // Height B is an ultra-giant tower! The barrier is macroscopically irrelevant.
      return createTower(1, B);
    }
  }

  // Case 2: Base A is a standard number (height === 0)
  let base = A.value;
  
  if (Math.abs(base - 10) < 1e-7) {
     if (Barrier.height === 0 && Barrier.value === 1 && !isBTower && B.value > 0 && B.value < 6) {
        return createTower(10, B.value - 1);
     } else if (!isBTower) {
        let bVal = Barrier.value;
        let bHeight = Barrier.height;
        let y = B.value;

        if (bHeight === 0 && bVal < 308) {
          let collapsedValue = Math.pow(10, bVal);
          if (Number.isFinite(collapsedValue) && collapsedValue < 1e300) {
            return createTower(collapsedValue, y - 1);
          }
        }
        return createTower(bVal, y + bHeight);
     } else {
        // Height B is an ultra-giant tower!
        return createTower(1, B);
     }
  }
  
  // Standard loop for small non-10 bases
  if (!isBTower) {
    let y = B.value;
    let iters = Math.min(y, 10);
    let current = createTower(Barrier.value, Barrier.height);
    
    for (let i = 0; i < iters; i++) {
      if (current.height === 0) {
        let next = Math.pow(base, current.value);
        if (Number.isFinite(next) && next < 1e300) {
          current.value = next;
        } else {
          current.value = current.value * Math.log10(base);
          current.height = 1;
        }
      } else if (current.height === 1) {
        current.value = current.value + Math.log10(Math.log10(base));
        current.height = 2;
      } else {
        current.height += 1;
      }
    }
    if (y > 10) current.height += (y - 10);
    return current;
  } else {
    return createTower(1, B);
  }
}

function executeRoot(degree, rad) {
  if (degree.height === 0 && rad.height === 0) {
    if (degree.value === 0) throw new Error("Root degree cannot be zero!");
    return createTower(Math.pow(rad.value, 1 / degree.value));
  }
  return rad;
}

function executeLog(base, arg) {
  if (base.height === 0 && arg.height === 0) {
    if (base.value <= 0 || base.value === 1) throw new Error("Invalid log base");
    if (arg.value <= 0) throw new Error("Log parameter must be greater than 0");
    if (base.value === 10) return createTower(Math.log10(arg.value));
    return createTower(Math.log(arg.value) / Math.log(base.value));
  }
  return arg;
}

function executeLn(arg) {
  if (arg.height === 0) {
    if (arg.value <= 0) throw new Error("ln parameter must be greater than 0");
    return createTower(Math.log(arg.value));
  }
  return arg;
}

function executeTrig(type, target) {
  if (target.height === 0) {
    let result = 0;
    if (type === 'sin') result = Math.sin(target.value);
    if (type === 'cos') result = Math.cos(target.value);
    if (type === 'tan') result = Math.tan(target.value);
    
    if (Math.abs(result) < 1e-15) result = 0;
    if (type === 'tan' && Math.abs(result) > 1e15) throw new Error("Tangent is undefined");
    
    return createTower(result);
  }
  return createTower(NaN); 
}

// ============================================================================
// SECTION 3: DISPLAY FORMATTING ROUTER
// ============================================================================

function formatTower(display, current) {
  // 1. Handle Infinity & NaN explicitly at the very beginning
  if (current.height === 0) {
    if (current.value === Infinity) return renderMath(display, "\\infty");
    if (current.value === -Infinity) return renderMath(display, "-\\infty");
    if (isNaN(current.value)) return renderMath(display, "\\text{Undefined}");
  }

  const toLatexSci = (num) => {
    let str = String(num);
    if (str.includes('e')) {
      let [coeff, exp] = str.split('e');
      exp = exp.replace('+', ''); 
      let parsedCoeff = parseFloat(coeff);
      let coeffStr = parsedCoeff.toFixed(4);
      if (coeff === '1' || coeffStr === '1.0000') return `10^{${exp}}`;
      return `${coeffStr} \\times 10^{${exp}}`;
    }
    return typeof formatValueClean === 'function' ? formatValueClean(num) : str;
  };

  // 2. Normalize standard number heights if applicable
  if (typeof current.height === 'number' && current.height >= 1) {
    while (current.value >= 1e10) {
      current.height += 1;
      current.value = Math.log10(current.value);
    }
  }

  // 3. Resolve Tetration Stack and delegate to formatTetration
  let stack = resolveTetrationStack(current);
  if (stack !== null) {
    return formatTetration(display, stack);
  }

  // 4. FALLBACK BASE CASES (For numbers below the tetration threshold)
  if (current.height === 0) {
    if (current.value < 10000000000) {
      let outputStr = Number(current.value.toFixed(10)).toString();
      renderMath(display, `${outputStr}`);
    } else {
      let logVal = Math.log10(current.value);
      renderMath(display, `10^{${toLatexSci(logVal)}}`);
    }
  } else {
    // Height 1+ fallback, converting to exact standard Scientific Notation (a * 10^b)
    let exp = Math.floor(current.value);
    let coeff = Math.pow(10, current.value - exp);
    
    if (coeff.toFixed(4) === "10.0000") {
      coeff = 1;
      exp += 1;
    }
    
    let coeffStr = coeff.toFixed(4);
    let latex = coeffStr === "1.0000" ? `10^{${toLatexSci(exp)}}` : `${coeffStr} \\times 10^{${toLatexSci(exp)}}`;
    
    for (let h = 0; h < current.height - 1; h++) {
      latex = `10^{${latex}}`;
    }
    renderMath(display, `${latex}`);
  }
}

// NEW: Dedicated Tetration Formatter
function formatTetration(display, stack) {
  let totalValue = stack.topTower.value;
  let a = Math.floor(totalValue);
  let frac = totalValue - a;
  let b = Math.pow(10, frac);

  // Determine if the fractional part is effectively an integer boundary
  let isInteger = (b.toFixed(4) === "1.0000" || b.toFixed(4) === "10.0000");

  // UNWIND LOGIC: Step down one base-10 layer to reveal the macroscopic top value.
  // This expands `b` to the [10, 10^10) range, 
  // transforming 10^^7 > 4.5600 directly into 10^^6 > 36305.xxxx
  if (!isInteger && a >= 1) {
    a -= 1;
    b = Math.pow(10, b);
  } else if (b.toFixed(4) === "10.0000") {
    a += 1;
    b = 1;
  }

  let bStr = b.toFixed(4);
  let latexStr = (isInteger || bStr === "1.0000") ? `${a}` : `${a} > ${bStr}`;
  
  if (stack.layers === 1) {
    renderMath(display, `10 \\uparrow\\uparrow {${latexStr}}`);
  } else {
    let prefix = "";
    for (let i = 0; i < stack.layers; i++) {
      prefix += "10 \\uparrow\\uparrow ";
    }
    renderMath(display, `${prefix}{${latexStr}}`);
  }
}

// Helper to extract the single continuous tetration height of any tower
function getTetrationHeightTower(t) {
  if (typeof t.height === 'object' && t.height !== null) {
    return t.height;
  }
  
  let h = t.height;
  let v = t.value;
  
  if (h === 0) {
    if (v >= 10) {
      h = 1;
      v = Math.log10(v);
    } else {
      return null;
    }
  }
  
  while (v >= 10) {
    h += 1;
    v = Math.log10(v);
  }
  
  return { height: 0, value: h + Math.log10(v) };
}

// Determines if a height tower exceeds the double tetration threshold (10^^6)
function isPastDoubleTetrationThreshold(t) {
  if (typeof t.height === 'object' && t.height !== null) return true;
  let h = t.height;
  let v = t.value;
  while (v >= 1e10 && h >= 1) {
    h += 1;
    v = Math.log10(v);
  }
  if (h > 6) return true;
  if (h === 6) return v > 1; 
  return false;
}

// Traverses up through the tetration layers to determine the final stack size
function resolveTetrationStack(current) {
  let isTetration = false;
  if (typeof current.height === 'object' && current.height !== null) isTetration = true;
  else if (typeof current.height === 'number' && current.height >= 6) isTetration = true;
  
  if (!isTetration) return null;
  
  let layers = 1;
  let curr = getTetrationHeightTower(current);
  
  while (curr !== null && isPastDoubleTetrationThreshold(curr)) {
    layers += 1;
    curr = getTetrationHeightTower(curr);
  }
  
  return { layers, topTower: curr };
}

// ============================================================================
// SECTION 4: THE OUTPUT RENDERING
// ============================================================================

function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  MathJax.typesetPromise([element]).catch((err) => console.log(err));
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
