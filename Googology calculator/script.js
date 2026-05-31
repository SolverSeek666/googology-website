// I use gemini to help me lmao

// ============================================================================
// SECTION 1: SETUP & INPUT (UNIFIED & FIXED)
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
    calculate(); // Fixed: Directly call the unified engine!
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

  // 1. Clean up & Normalize input (lowercases everything EXCEPT capital 'E', swaps 'x', and clears spaces)
  let expr = inputEl.value
    .replace(/[^E]/g, char => char.toLowerCase())
    .replace(/x/g, '*')
    .replace(/\s+/g, '');

  // 2. Tokenize using the upgraded, symbol-aware Regex layout (added Γ and γ)
  tokens = expr.match(/\d+(?:\.\d+)?|\^\^\^|\^\^|[a-z]+|E|[-+*/^()!>√πϕ∞,Γγ]/g) || [];
  tokenIndex = 0; // Reset pointer for the fresh execution descent

  try {
    if (tokens.length === 0) {
      throw new Error("Please enter an expression");
    }

    // 3. Run the recursive descent parser engine
    let resultTower = parseExpression();

    // 4. Check if syntax errors left dangling unparsed elements behind
    if (tokenIndex < tokens.length) {
      throw new Error("Unexpected token: " + tokens[tokenIndex]);
    }

    // 5. Send structural tower to your MathJax display formatter
    formatTower(displayEl, resultTower);

  } catch (err) {
    // Gracefully catch system faults and display an elegant MathJax message block
    displayEl.innerHTML = `\\[ \\text{Error: ${err.message}} \\]`;
    if (window.MathJax) {
      window.MathJax.typesetPromise([displayEl]);
    }
  }
}

// ============================================================================
// SECTION 2: THE MATH BRAIN (ROBUST PARSER ENGINE)
// Uses a Recursive Descent Parser to enforce true mathematical precedence.
// ============================================================================

// Helper to initialize a Tower structure
function createTower(val, height = 0) {
  return { value: val, height: height };
}

// 1. Precedence Level: Addition & Subtraction
function parseExpression() {
  let node = parseTerm();
  while (true) {
    if (match('+')) {
      let right = parseTerm();
      node = addTowers(node, right);
    } else if (match('-')) {
      let right = parseTerm();
      node = subtractTowers(node, right);
    } else {
      break;
    }
  }
  return node;
}

// 2. Precedence Level: Multiplication & Division
function parseTerm() {
  // FIXED: Now evaluates Pentation before Multiplication!
  let node = parsePentation(); 
  while (true) {
    if (match('*')) {
      let right = parsePentation();
      node = multiplyTowers(node, right);
    } else if (match('/')) {
      let right = parsePentation();
      node = divideTowers(node, right);
    } else {
      break;
    }
  }
  return node;
}

// 2.5 Precedence Level: Pentation (^^^) - Right Associative
function parsePentation() {
  let node = parseTetration(); // Drops down to Tetration if no ^^^ is found
  if (match('^^^')) {
    let right = parsePentation(); // Right-associative (evaluates right-to-left)
    node = computePentation(node, right);
  }
  return node;
}

// 3. Precedence Level: Tetration (^^) and Barrier (>) - Right Associative
function parseTetration() {
  let node = parsePower(); 
  if (match('^^')) {
    let right = parseTetration(); 
    let barrier = createTower(1, 0);
    if (match('>')) {
      // Grab the entire remaining expression as the barrier block
      barrier = parseExpression();
    }
    node = computeTetration(node, right, barrier);
  }
  return node;
}

// 4. Precedence Level: Powers (^) - Right Associative
function parsePower() {
  let node = parseFactorial(); 
  if (match('^')) {
    let right = parsePower(); 
    node = powerTowers(node, right);
  }
  return node;
}

// 5. Precedence Level: Postfix Factorials (!)
function parseFactorial() {
  let node = parsePrimary();
  let k = 0;
  while (match('!')) {
    k++;
  }
  if (k > 0) {
    for (let j = 0; j < k; j++) {
      if (node.height === 0) {
        // Standard numbers run through the multi-factorial logic
        let factRes = solveMultifactorial(node.value, (j === 0 ? k : 1));
        if (!factRes || isNaN(factRes.value)) throw new Error("Invalid factorial target");
        node = factRes;
        if (j === 0) break; // Multi-factorial handled all exclamation marks at once
      } else if (node.height === 1) {
        // High Precision Stirling transformation for a height-1 tower: (10^v)!
        // log10((10^v)!) = 10^v * (v - log10(e))
        // Turning this back into a height-2 tower top value: v + log10(v - log10(e))
        if (node.value > Math.LOG10E) {
          node = createTower(node.value + Math.log10(node.value - Math.LOG10E), 2);
        } else {
          node = createTower(node.value, node.height + 1);
        }
      } else if (node.height === 2) {
        // High Precision Stirling transformation for a height-2 tower: (10^10^v)!
        // This shifts the top value slightly based on the layer below it
        node = createTower(Math.log10(Math.pow(10, node.value) + node.value), 3);
      } else {
        // For height >= 3, the factorial value shift is so microscopically tiny 
        // on a log-scale that growing the tower height by 1 is perfectly accurate.
        node = createTower(node.value, node.height + 1);
      }
    }
  }
  return node;
}

// Helper to read multiple arguments like (a,b) for log and roots
function parseFunctionArgs() {
  if (match('(')) {
    let args = [parseExpression()];
    while (match(',')) {
      args.push(parseExpression());
    }
    if (!match(')')) throw new Error("Missing closing parenthesis");
    return args;
  }
  // Fallback for normal spacing, e.g., "log 10" instead of "log(10)"
  return [parsePrimary()]; 
}

// 6. Core Elements: Numbers, Constants, Parentheses, Unary signs, and Functions
function parsePrimary() {
  let t = peek();
  if (!t) throw new Error("Unexpected end of expression");

  // Standalone Hyper-E notation (Ea syntax, e.g., E3 = 10^3)
  if (t === 'E') {
    consume();
    // Changed from parseUnary to parsePrimary
    let exponent = parsePrimary(); 
    return computeHyperE(createTower(1, 0), exponent); 
  }

  // 1. Parentheses
  if (t === '(') {
    consume();
    let node = parseExpression();
    if (!match(')')) throw new Error("Missing closing parenthesis");
    return node;
  }

  // 2. Unary Operators
  if (t === '-') {
    consume();
    let node = parsePrimary();
    if (node.height === 0) return createTower(-node.value, 0);
    return node; 
  }
  if (t === '+') {
    consume();
    return parsePrimary();
  }

  // 3. Roots: √(x) or √(n, x)
  if (t === '√') {
    consume();
    let args = parseFunctionArgs();
    let n = args.length === 2 ? args[0] : createTower(2, 0);
    let val = args.length === 2 ? args[1] : args[0];
    return powerTowers(val, divideTowers(createTower(1, 0), n));
  }

  // 4. Logarithms: log(x) or log(base, x)
  if (t === 'log') {
    consume();
    let args = parseFunctionArgs();
    let base = args.length === 2 ? args[0] : createTower(10, 0);
    let val = args.length === 2 ? args[1] : args[0];
    
    const towerLog10 = (node) => node.height >= 1 ? createTower(node.value, node.height - 1) : createTower(Math.log10(node.value), 0);
    return divideTowers(towerLog10(val), towerLog10(base));
  }

  if (t === 'ln') {
    consume();
    let args = parseFunctionArgs();
    let val = args[0];
    if (val.height === 0) return createTower(Math.log(val.value), 0);
    if (val.height === 1) return multiplyTowers(createTower(val.value, 0), createTower(Math.log(10), 0));
    return createTower(val.value, val.height - 1);
  }

  // 5. Trigonometry
  if (t === 'sin' || t === 'cos' || t === 'tan') {
    let op = t;
    consume();
    let args = parseFunctionArgs();
    let val = args[0];
    
    if (val.value === Infinity || val.value === -Infinity || val.height > 0) {
      return createTower(NaN, 0); 
    }
    
    let res = 0;
    if (op === 'sin') res = Math.sin(val.value);
    if (op === 'cos') res = Math.cos(val.value);
    if (op === 'tan') {
      if (Math.abs(Math.cos(val.value)) < 1e-10) return createTower(NaN, 0); 
      res = Math.tan(val.value);
    }
    return createTower(res, 0);
  }

  // 6. Gamma Function Γ(x)
  if (t === 'gamma' || t === 'γ' || t === 'Γ') {
    consume();
    let args = parseFunctionArgs();
    let node = args[0];
  
    // Uses the extracted helper safely handling tower logic
    let res = evaluateGamma(node.value, node.height);
    return createTower(res.value, res.height);
  }
  
  // 7. Constants and Base Numbers
  consume();
  let node;

  if (t === 'googol') node = createTower(100, 1);
  else if (t === 'googolplex') node = createTower(100, 2);
  else if (t === 'infinity' || t === '∞') node = createTower(Infinity, 0);
  else if (t === 'phi' || t === 'ϕ') node = createTower((1 + Math.sqrt(5)) / 2, 0);
  else if (t === 'pi' || t === 'π') node = createTower(Math.PI, 0);
  else if (t === 'e') node = createTower(Math.E, 0); 
  else {
    // Standard Numeric Fallback
    let num = Number(t);
    if (!isNaN(num)) {
      node = createTower(num, 0);
    } else {
      throw new Error("Unknown token: " + t);
    }
  }

  // Catch Hyper-E trailing notation (aEb syntax, e.g., 5E3)
  while (peek() === 'E') {
    consume(); // eat the uppercase 'E'
    // Changed from parseUnary to parsePrimary
    let exponent = parsePrimary(); 
    node = computeHyperE(node, exponent);
  }

  return node;
}

// ============================================================================
// SECTION 2.2: TOWER ARITHMETIC UTILITIES
// Handles interactions between high towers and low mathematical numbers.
// ============================================================================

// Converts a decimal into the closest whole-number fraction a/b
function getFractionComponents(decimal) {
  let bestA = 1, bestB = 1;
  let minDiff = Infinity;
  
  // Scan denominators up to 1000 to find the perfect match
  for (let b = 1; b <= 1000; b++) {
    let a = Math.round(decimal * b);
    let diff = Math.abs(decimal - (a / b));
    if (diff < minDiff) {
      minDiff = diff;
      bestA = a;
      bestB = b;
      if (diff < 1e-6) break; // Found an exact match
    }
  }
  return { a: bestA, b: bestB };
}

// Operators===================================================================

function addTowers(A, B) {
  if (isNaN(A.value) || isNaN(B.value)) return createTower(NaN, 0);
  if (A.value === Infinity || B.value === Infinity) return createTower(Infinity, 0);
  
  if (A.height === 0 && B.height === 0) return createTower(A.value + B.value, 0);
  return A.height >= B.height ? A : B; 
}

function subtractTowers(A, B) {
  if (isNaN(A.value) || isNaN(B.value)) return createTower(NaN, 0);
  if (A.value === Infinity && B.value === Infinity) return createTower(NaN, 0); // ∞ - ∞ is undefined
  if (A.value === Infinity) return createTower(Infinity, 0);
  if (B.value === Infinity) return createTower(-Infinity, 0);

  if (A.height === 0 && B.height === 0) return createTower(A.value - B.value, 0);
  return A;
}

function multiplyTowers(A, B) {
  if (isNaN(A.value) || isNaN(B.value)) return createTower(NaN, 0);
  if (A.value === Infinity || B.value === Infinity) {
    if (A.value === 0 || B.value === 0) return createTower(NaN, 0); // 0 * ∞ is undefined
    return createTower(Infinity, 0);
  }

  if (A.height === 0 && B.height === 0) return createTower(A.value * B.value, 0);
  if (A.height === 1 && B.height === 0) return createTower(A.value + Math.log10(B.value), 1);
  if (B.height === 1 && A.height === 0) return createTower(B.value + Math.log10(A.value), 1);
  return A.height >= B.height ? A : B;
}

function divideTowers(A, B) {
  if (isNaN(A.value) || isNaN(B.value)) return createTower(NaN, 0);
  if (A.value === Infinity && B.value === Infinity) return createTower(NaN, 0); // ∞ / ∞
  if (A.value === Infinity) return createTower(Infinity, 0);
  if (B.value === Infinity) return createTower(0, 0);
  if (B.height === 0 && B.value === 0) return createTower(Infinity, 0); // x / 0

  if (A.height === 0 && B.height === 0) return createTower(A.value / B.value, 0);
  if (A.height === 1 && B.height === 0) return createTower(A.value - Math.log10(B.value), 1);
  return A;
}

function powerTowers(A, B) {
  // Case 0: INFINITY
  if (isNaN(A.value) || isNaN(B.value)) return createTower(NaN, 0);
  
  // Infinity / Zero Guardrails
  if (B.height === 0 && B.value === 0) return createTower(1, 0);
  if (A.height === 0 && A.value === 0 && B.value > 0) return createTower(0, 0);
  if (A.value === Infinity) return createTower(Infinity, 0);
  if (B.value === Infinity) {
    if (A.height === 0 && A.value === 1) return createTower(NaN, 0); // 1^∞ is indeterminate
    if (A.height === 0 && A.value < 1 && A.value > -1) return createTower(0, 0); // 0.5^∞ is 0
    return createTower(Infinity, 0);
  }
  
  // Case 1: Both are standard numbers (height 0)
  if (A.height === 0 && B.height === 0) {
    let next = Math.pow(A.value, B.value);
    if (Number.isFinite(next) && next < 1e300) {
      return createTower(next, 0);
    } else {
      return createTower(B.value * Math.log10(A.value), 1);
    }
  }

  // Case 2: Base A is a height-1 tower (10^A.value), Exponent B is a standard number
  // (10^A.value)^B = 10^(A.value * B)
  if (A.height === 1 && B.height === 0) {
    return createTower(A.value * B.value, 1);
  }

  // Case 3: Base A is a height-2 tower (10^10^A.value), Exponent B is a standard number
  // (10^10^A.value)^B = 10^(10^A.value * B) = 10^10^(A.value + log10(B))
  if (A.height === 2 && B.height === 0) {
    return createTower(A.value + Math.log10(B.value), 2);
  }

  // Case 4: Base A is a massive tower (height >= 3), small exponent B is completely negligible
  if (A.height >= 3 && B.height === 0) {
    return A;
  }

  // Case 5: Exponent B is a tower (height >= 1), Base A is a standard number
  if (A.height === 0 && B.height >= 1) {
    if (B.height === 1) {
      let logBase = Math.log10(A.value);
      return createTower(B.value + (logBase > 0 ? Math.log10(logBase) : 0), 2);
    }
    return createTower(B.value, B.height + 1);
  }

  // Case 6: Both are towers (height >= 1)
  if (A.height >= 1 && B.height >= 1) {
    // Subcase 6a: Both are height 1. 
    // (10^v)^(10^w) = 10^(v * 10^w) = 10^(10^(w + log10(v)))
    if (A.height === 1 && B.height === 1) {
      return createTower(B.value + Math.log10(A.value), 2);
    }
    
    // Subcase 6b: Base is height 2, Exponent is height 1
    // (10^10^v)^(10^w) = 10^(10^v * 10^w) = 10^(10^(v + w))
    if (A.height === 2 && B.height === 1) {
      return createTower(A.value + B.value, 2);
    }

    // Subcase 6c: Ultra-high towers. The taller or larger tower completely dominates.
    // The result climbs exactly 1 level higher than the dominant tower.
    if (B.height >= A.height) {
      return createTower(B.value, B.height + 1);
    } else {
      return createTower(A.value, A.height + 1);
    }
  }

  return A;
}

function computeTetration(A, B, Barrier) {
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
    
    return computeTetration(A, newB, newBarrier);
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

// ============================================================================
// PENTATION ENGINE (FIXED BOUNDARY FOR 10^^^6)
// ============================================================================
function computePentation(A, B) {
  if (isNaN(A.value) || isNaN(B.value)) return { value: NaN, height: 0 };
  if (B.value === 0) return { value: 1, height: 0 }; 
  if (B.value === 1) return A;
  
  // FIX: Changed '>' to '>=' so 10^^^6 transforms into pentation instantly
  if (A.value === 10 && B.value >= 6) {
    return {
      value: B.value,
      height: 1,
      isPentation: true,
      base: 10,
      pentationHeight: B.value
    };
  }
  
  // Fallback computation for smaller numbers, stacks, or fractional steps
  let floorB = Math.floor(B.value);
  let f = B.value - floorB;
  
  // Linear height approximation for decimal pentation baseline
  let current = { value: 1 + f * (A.value - 1), height: 0 };
  
  for (let i = 0; i < floorB; i++) {
    let defaultBarrier = { value: 1, height: 0 };
    current = computeTetration(A, current, defaultBarrier);
  }
  
  // FIX: Changed '>' to '>=' here as well for safety
  if (A.value === 10 && B.value >= 6) {
    return {
      value: B.value,
      height: 1,
      isPentation: true,
      base: 10,
      pentationHeight: B.value
    };
  }
  
  return current;
}

// Hyper-E=====================================================================

function computeHyperE(A, B) {
  if (isNaN(A.value) || isNaN(B.value)) return createTower(NaN, 0);

  let tenToTheB;
  // If the exponent is small, compute it normally
  if (B.height === 0 && B.value < 300) {
    tenToTheB = createTower(Math.pow(10, B.value), 0);
  } else {
    // For 10^300 and beyond, it smoothly gains +1 tower height
    tenToTheB = createTower(B.value, B.height + 1);
  }

  return multiplyTowers(A, tenToTheB);
}

// ============================================================================
// NEW HELPER: GAMMA FUNCTION EVALUATOR
// ============================================================================
function evaluateGamma(val, height = 0) {
  if (height === 0) {
    if (val === Infinity) return { value: Infinity, height: 0 };
    if (val === 0 || (val < 0 && Number.isInteger(val))) return { value: NaN, height: 0 };
    if (val === 1 || val === 2) return { value: 1, height: 0 };
    
    // Integer shortcut
    if (val <= 171 && Number.isInteger(val) && val > 0) {
      let g = 1;
      for (let i = 2; i < val; i++) g *= i;
      return { value: g, height: 0 };
    }
    
    // Argument Shifting Trick for Stirling precision
    let shift = 0;
    let shiftFactor = 1;
    while (val < 10) {
      shiftFactor *= val;
      val += 1;
      shift++;
    }
    
    let log10Gamma = (val - 0.5) * Math.log10(val) - val * Math.LOG10E + 0.5 * Math.log10(2 * Math.PI);
    
    if (shift > 0) {
      log10Gamma -= Math.log10(shiftFactor);
    }
    
    if (log10Gamma < 300) {
      return { value: Math.pow(10, log10Gamma), height: 0 };
    }
    
    return { value: log10Gamma, height: 1 };
  }
  
  return { value: val, height: height + 1 };
}

// ============================================================================
// SECTION 2.5: FACTORIAL CORE ENGINE HELPERS
// Recursively unwraps strings like ((10!)!) and computes multifactorials.
// ============================================================================

function parseFactorialExpression(s) {
  s = s.trim();
  
  // Count consecutive trailing exclamation marks (e.g., !! is step 2, !!! is step 3)
  let k = 0;
  while (s.endsWith('!')) {
    k++;
    s = s.slice(0, -1).trim();
  }
  
  // Remove wrapping parentheses if they surround the remaining expression
  if (s.startsWith('(') && s.endsWith(')')) {
    s = s.slice(1, -1).trim();
  }
  
  // If exclamation marks were processed, solve recursively
  if (k > 0) {
    let inner = parseFactorialExpression(s);
    if (!inner || isNaN(inner.value)) return null;
    
    // If the inner value is already a giant tower, an additional factorial
    // scales it up by another tower level layer.
    if (inner.height > 0) {
      return { value: inner.value, height: inner.height + 1 };
    }
    
    return solveMultifactorial(inner.value, k);
  }
  
  // Base case: No exclamation marks left, evaluate standard math block
  try {
    let jsExpr = s.replace(/\^/g, '**');
    let val = Function(`"use strict"; return (${jsExpr})`)();
    if (!isNaN(val) && Number.isFinite(val)) {
      return { value: val, height: 0 };
    }
  } catch (e) {}
  
  return null;
}

function solveMultifactorial(x, k) {
  if (x < 0 || isNaN(x)) return { value: NaN, height: 0 };
  
  // FIX: Intercept single decimal factorials (x! = Gamma(x + 1))
  if (k === 1 && !Number.isInteger(x)) {
    return evaluateGamma(x + 1, 0);
  }
  
  x = Math.round(x); // Safe to keep for standard integers / multifactorials
  
  // Case A: Number is small enough to evaluate cleanly without hitting Infinity
  if (x <= 170) {
    let res = 1;
    for (let i = x; i > 0; i -= k) {
      res *= i;
    }
    if (Number.isFinite(res) && res < 1e300) {
      return { value: res, height: 0 };
    }
  }
  
  // Case B: Medium numbers (up to 500,000). Loop via log10 for perfect precision.
  if (x <= 500000) {
    let logSum = 0;
    for (let i = x; i > 0; i -= k) {
      logSum += Math.log10(i);
    }
    return { value: logSum, height: 1 };
  }
  
  // Case C: Gigantic numbers. Use Generalized Stirling Approximation to prevent browser lag.
  const log10e = Math.LOG10E;
  let part1 = (x / k) * (Math.log10(x) - log10e);
  let part2 = 0.5 * Math.log10(2 * Math.PI * x / k);
  return { value: part1 + part2, height: 1 };
}

// ============================================================================
// SECTION 3: DISPLAY FORMATTING ROUTER (TETRATION / PENTATION)
// ============================================================================

function formatTower(display, current) {
  // 1. Handle Infinity & NaN explicitly at the very beginning
  if (current.height === 0) {
    if (current.value === Infinity) return renderMath(display, "\\infty");
    if (current.value === -Infinity) return renderMath(display, "-\\infty");
    if (isNaN(current.value)) return renderMath(display, "\\text{Undefined}");
  }

  // 2. EXPLICIT PENTATION ROUTE (Only triggers if explicitly generated by computePentation)
  if (current.isPentation === true) {
    let pHeight = current.pentationHeight;
    // Keep decimals clean (e.g., 10^^^3 or 10^^^2.4000)
    let formattedP = pHeight % 1 === 0 ? pHeight.toString() : pHeight.toFixed(4);
    return renderMath(display, `10 \\uparrow\\uparrow\\uparrow {${formattedP}}`);
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

  // 3. Normalize standard number heights if applicable
  if (typeof current.height === 'number' && current.height >= 1) {
    while (current.value >= 1e10) {
      current.height += 1;
      current.value = Math.log10(current.value);
    }
  }

  // 4. Resolve Tetration Stack (Safely renders giant tetrations without turning them into pentation)
  let stack = resolveTetrationStack(current);
  
  if (stack !== null) {
    let formattedStr = formatBaseTower(stack.topTower);
    
    if (stack.layers === 1) {
      if (formattedStr.includes("\\times")) {
        renderMath(display, `10 \\uparrow\\uparrow {(${formattedStr})}`);
      } else {
        renderMath(display, `10 \\uparrow\\uparrow {${formattedStr}}`);
      }
    } else {
      let prefix = "";
      for (let i = 0; i < stack.layers; i++) {
        prefix += "10 \\uparrow\\uparrow ";
      }
      renderMath(display, `${prefix}{${formattedStr}}`);
    }
    return;
  }

  // 5. FALLBACK BASE CASES (For standard large numbers)
  if (current.height === 0) {
    if (current.value < 10000000000) {
      let outputStr = Number(current.value.toFixed(10)).toString();
      renderMath(display, `${outputStr}`);
    } else {
      let latex = renderHeight1(Math.log10(current.value));
      renderMath(display, latex);
    }
  } else if (current.height === 1) {
    let latex = renderHeight1(current.value);
    renderMath(display, latex);
  } else {
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

// ============================================================================
// FIXED: TOWER DISPLAY LAYER RENDERER FOR HEIGHT 1 (WITH COEFFICIENT RESCUE)
// ============================================================================
function renderHeight1(tower) {
  let val = (typeof tower === 'object' && tower !== null) ? tower.value : tower;
  
  if (isNaN(val) || val === undefined) return "\\text{NaN}";
  if (val === Infinity) return "10^{\\infty}";

  // Format numbers below 10^1000 using raw exponents if preferred,
  // or jump straight to scientific notation processing below.
  if (val < 10) {
    return `10^{${val.toFixed(4)}}`;
  }

  if (val < 1e10) {
    // 1. Separate the integer exponent and the fractional part
    let exp = Math.floor(val);
    let frac = val - exp;
    
    // 2. Reconstruct the standard scientific notation coefficient (a)
    let coeff = Math.pow(10, frac);
    
    // 3. Handle edge-case rounding up (e.g., 9.99999... -> 10.0000)
    if (coeff.toFixed(4) === "10.0000") {
      coeff = 1;
      exp += 1;
    }
    
    let coeffStr = coeff.toFixed(4);
    
    // If the coefficient is perfectly 1, keep it clean: 10^b
    if (coeffStr === "1.0000") {
      return `10^{${exp}}`;
    }
    
    // Otherwise, return the beautiful a \times 10^b format you wanted!
    return `${coeffStr} \\times 10^{${exp}}`;
    
  } else {
    // For completely cosmic numbers where the exponent itself needs scientific notation
    let str = val.toExponential(4).replace("e+", "e");
    let [coeff, exp] = str.split('e');
    if (coeff === '1' || parseFloat(coeff).toFixed(4) === '1.0000') {
      return `10^{10^{${exp}}}`;
    }
    return `10^{${parseFloat(coeff).toFixed(4)} \\times 10^{${exp}}}`;
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
  if (h === 6) return v > 1; // Since 10^^6 fully normalizes down to height 6, value 1
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

// Formats the remaining top-level base tower into clean scientific notation or basic towers
function formatBaseTower(t) {
  if (!t) return "0";
  
  const cleanSci = (num) => {
    let str = String(num);
    if (str.includes('e')) {
      let [coeff, exp] = str.split('e');
      exp = exp.replace('+', ''); 
      let parsedCoeff = parseFloat(coeff);
      let coeffStr = parsedCoeff.toFixed(4);
      if (coeff === '1' || coeffStr === '1.0000') return `10^{${exp}}`;
      return `${coeffStr} \\times 10^{${exp}}`;
    }
    if (num >= 1e10) {
      let log = Math.log10(num);
      let exp = Math.floor(log);
      let coeff = Math.pow(10, log - exp);
      if (coeff.toFixed(4) === "10.0000") {
        coeff = 1;
        exp += 1;
      }
      let coeffStr = coeff.toFixed(4);
      if (coeffStr === "1.0000") return `10^{${exp}}`;
      return `${coeffStr} \\times 10^{${exp}}`;
    }
    return str;
  };

  if (t.height === 0) {
    if (t.value < 100000) {
      return Number(t.value.toFixed(4)).toString();
    }
    return cleanSci(t.value);
  }
  
  let exp = Math.floor(t.value);
  let coeff = Math.pow(10, t.value - exp);
  if (coeff.toFixed(4) === "10.0000") {
    coeff = 1;
    exp += 1;
  }
  
  let coeffStr = coeff.toFixed(4);
  let expStr = exp >= 100000 ? cleanSci(exp) : exp.toString();
  let latex = coeffStr === "1.0000" ? `10^{${expStr}}` : `${coeffStr} \\times 10^{${expStr}}`;
  
  for (let h = 0; h < t.height - 1; h++) {
    latex = `10^{${latex}}`;
  }
  return latex;
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
// These stuff are preserved for archival purposes.
// ===================================================================

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
