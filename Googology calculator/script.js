// I use gemini to help me lmao

// ============================================================================
// SECTION 1: SETUP & INPUT
// ============================================================================

const PHI = (1 + Math.sqrt(5)) / 2;

// Listen for the "Enter" key in the input box to start the calculation
document.getElementById('calcInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const input = this.value.trim();
    if (input) {
      processGoogology(input);
    }
  }
});

// ============================================================================
// SECTION 2: THE MATH BRAIN (ROBUST PARSER ENGINE)
// Uses a Recursive Descent Parser to enforce true mathematical precedence.
// ============================================================================

// Global parser state
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

// Helper to initialize a Tower structure
function createTower(val, height = 0) {
  return { value: val, height: height };
}

function processGoogology(rawInput) {
  const display = document.getElementById('outputDisplay');
  
  // Clean up the input: convert to lowercase, swap 'x' for '*', remove spaces
  let expr = rawInput.toLowerCase().replace(/x/g, '*').replace(/\s+/g, '');
  expr = expr.replace(/phi/g, `(${PHI})`);
  
  // Hardcoded Easter eggs
  if (expr === 'googol') return renderMath(display, `\\text{Result: } 10^{100}`); 
  if (expr === 'googolplex') return renderMath(display, `\\text{Result: } 10^{10^{100}}`); 

  try {
    // Tokenize the expression into numbers, operators, and structural elements
    const tokenRegex = /\d+(?:\.\d+)?(?:e[+-]?\d+)?|\^\^|\^|!|[-+*/()>]|[a-z]+/g;
    tokens = expr.match(tokenRegex) || [];
    tokenIndex = 0;

    if (tokens.length === 0) throw new Error("Empty expression");

    // Start parsing from lowest precedence (addition/subtraction)
    let finalTower = parseExpression();

    if (tokenIndex < tokens.length) {
      throw new Error("Unparsed tokens remaining");
    }

    formatTower(display, finalTower);
    return;
  } catch (err) {
    return renderMath(display, `\\text{Error: Could not compute expression.}`);
  }
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
  let node = parsePower();
  while (true) {
    if (match('*')) {
      let right = parsePower();
      node = multiplyTowers(node, right);
    } else if (match('/')) {
      let right = parsePower();
      node = divideTowers(node, right);
    } else {
      break;
    }
  }
  return node;
}

// 3. Precedence Level: Powers (^) - Right Associative
function parsePower() {
  let node = parseTetration();
  if (match('^')) {
    let right = parsePower(); 
    node = powerTowers(node, right);
  }
  return node;
}

// 4. Precedence Level: Tetration (^^) and Barrier (>) - Right Associative
function parseTetration() {
  let node = parseFactorial();
  if (match('^^')) {
    let right = parseTetration(); 
    let barrier = createTower(1, 0);
    if (match('>')) {
      // FIXED: Grab the entire remaining expression as the barrier block
      barrier = parseExpression();
    }
    node = computeTetration(node, right, barrier);
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

// 6. Core Elements: Numbers, Constants, Parentheses, Unary signs
function parsePrimary() {
  let t = peek();
  if (!t) throw new Error("Unexpected end of expression");

  if (t === '(') {
    consume();
    let node = parseExpression();
    if (!match(')')) throw new Error("Missing closing parenthesis");
    return node;
  }

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

  consume();
  if (t === 'googol') return createTower(100, 1);
  if (t === 'googolplex') return createTower(100, 2);
  if (t === 'phi') return createTower(PHI, 0);

  let num = Number(t);
  if (!isNaN(num)) {
    return createTower(num, 0);
  }

  throw new Error("Unknown token");
}

// ============================================================================
// SECTION 2.2: TOWER ARITHMETIC UTILITIES
// Handles interactions between high towers and low mathematical numbers.
// ============================================================================

function addTowers(A, B) {
  if (A.height === 0 && B.height === 0) return createTower(A.value + B.value, 0);
  return A.height >= B.height ? A : B; // Tower completely dominates standard addition
}

function subtractTowers(A, B) {
  if (A.height === 0 && B.height === 0) return createTower(A.value - B.value, 0);
  return A; // Tower dominates subtraction
}

function multiplyTowers(A, B) {
  if (A.height === 0 && B.height === 0) return createTower(A.value * B.value, 0);
  if (A.height === 1 && B.height === 0) return createTower(A.value + Math.log10(B.value), 1);
  if (B.height === 1 && A.height === 0) return createTower(B.value + Math.log10(A.value), 1);
  return A.height >= B.height ? A : B;
}

function divideTowers(A, B) {
  if (A.height === 0 && B.height === 0) return createTower(A.value / B.value, 0);
  if (A.height === 1 && B.height === 0) return createTower(A.value - Math.log10(B.value), 1);
  return A;
}

function powerTowers(A, B) {
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
  // Case 1: Base A is already a giant tower (height >= 1)
  if (A.height >= 1) {
    if (B.height === 0) {
      let y = B.value;
      if (y === 1) return A; // X ^^ 1 = X
      
      let bVal = Barrier.value;
      let bHeight = Barrier.height;

      if (A.height === 1) {
        // Base is a height-1 tower: (10^v) ^^ y > Barrier
        if (bHeight === 0) {
          // Exact law: (10^v)^(10^v)^b = 10^(v * 10^(v*b))
          let topVal = A.value * bVal + (A.value > 0 ? Math.log10(A.value) : 0);
          return createTower(topVal, y);
        } else {
          // If the barrier itself is a tower, its height completely dominates
          return createTower(bVal, bHeight + y);
        }
      } else if (A.height === 2) {
        // Base is a height-2 tower: (10^10^v) ^^ y > Barrier
        if (bHeight === 0) {
          // Exact law: (10^10^v)^(10^10^v)^b = 10^10^(v + b * 10^v)
          let topVal = A.value;
          if (A.value <= 308) { // Prevent JS Infinity overflow during Math.pow
            topVal = A.value + bVal * Math.pow(10, A.value);
          }
          return createTower(topVal, y);
        } else {
          return createTower(bVal, bHeight + y);
        }
      } else {
        // For height >= 3, structural layers completely dwarf any standard barrier.
        // Stacking the tower y times simply adds exactly (y - 1) layers.
        return createTower(A.value, A.height + y - 1);
      }
    } else {
      // Exponent B is also a tower.
      return createTower(B.value, B.height + 1);
    }
  }

  // Case 2: Base A is a standard number (height === 0)
  let base = A.value;
  
  // ============================================================================
  // FIXED: Native Tower Barrier Support for Base 10
  // Instead of flattening the barrier to 1, we read its full tower properties.
  // A high barrier adds its own height layers to the final tetration tower.
  // ============================================================================
  
  if (Math.abs(base - 10) < 1e-7) {
     if (Barrier.height === 0 && Barrier.value === 1 && B.height === 0 && B.value > 0 && B.value < 6) {
        return createTower(10, B.value - 1);
     } else if (B.height === 0) {
        // 10 ^^ y > Barrier -> The result total height expands by the barrier's height layers!
        return createTower(Barrier.value, B.value + Barrier.height);
     } else {
        return createTower(B.value, B.height + 1);
     }
  }
  
  if (B.height === 0) {
    let y = B.value;
    let iters = Math.min(y, 10);
    
    // FIXED: Non-base-10 towers now also inherit the incoming barrier tower height correctly
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
    return createTower(B.value, B.height + 1);
  }
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
  x = Math.round(x);
  
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
// SECTION 3: DISPLAY FORMATTING ROUTER
// ============================================================================

function formatTower(display, current) {
  const toLatexSci = (num) => {
    let str = String(num);
    if (str.includes('e')) {
      let [coeff, exp] = str.split('e');
      exp = exp.replace('+', ''); 
      
      // Parse the coefficient and force it to 4 decimal places
      let parsedCoeff = parseFloat(coeff);
      let coeffStr = parsedCoeff.toFixed(4);
      
      // Keep the clean clean 10^{exp} look if it's a perfect power of 10
      if (coeff === '1' || coeffStr === '1.0000') return `10^{${exp}}`;
      
      // Otherwise, return it with its beautiful trailing zeros!
      return `${coeffStr} \\times 10^{${exp}}`;
    }
    return typeof formatValueClean === 'function' ? formatValueClean(num) : str;
  };

  // ============================================================================
  // FIXED: Generalized Tower Shifting (Normalization)
  // If any tower (height >= 1) has a top value >= 1e10, we continuously shift 
  // it up into the tower height layers until the remaining top value 'd' 
  // is nicely compressed below 10^10. This transforms 10^^a>b into 10^^c>d.
  // ============================================================================
  if (current.height >= 1) {
    while (current.value >= 1e10) {
      current.height += 1;
      current.value = Math.log10(current.value);
    }
  }

  if (current.height >= 6) {
    let a = current.height;
    let b = current.value;
    
    if (Math.abs(b - 10) < 1e-4 || b.toFixed(4) === "10.0000") {
      a += 1;
      b = 1;
    }
    
    let heightStr = toLatexSci(a);
    
    if (Math.abs(b - 1) < 1e-4 || b.toFixed(4) === "1.0000") {
      renderMath(display, `10 \\uparrow\\uparrow {${heightStr}}`);
    } else {
      let bStr = b < 1e10 ? Number(b.toFixed(4)).toString() : toLatexSci(b);
      renderMath(display, `10 \\uparrow\\uparrow {${heightStr}} > ${bStr}`);
    }
    return;
  }

  if (current.height === 0) {
    if (current.value < 10000000000) {
      let outputStr = Number(current.value.toFixed(10)).toString();
      renderMath(display, `${outputStr}`);
    } else {
      renderHeight1(display, Math.log10(current.value));
    }
  } else if (current.height === 1) {
    renderHeight1(display, current.value);
  } else {
    let exp = Math.floor(current.value);
    let coeff = Math.pow(10, current.value - exp);
    
    if (coeff.toFixed(4) === "10.0000") {
      coeff = 1;
      exp += 1;
    }
    
    let coeffStr = coeff.toFixed(4);
    let latex = coeffStr === "1.0000" ? `10^{${toLatexSci(exp)}}` : `${coeffStr} \\times 10^{${toLatexSci(exp)}}`;
    
    // Loop height - 1 times, because the 'latex' string already absorbed the first base-10!
    for (let h = 0; h < current.height - 1; h++) {
      latex = `10^{${latex}}`;
    }
    renderMath(display, `${latex}`);
  }
}

function formatValueClean(v) {
  if (v < 1e10) return Math.floor(v).toString();
  let log = Math.log10(v);
  let exp = Math.floor(log);
  let coeff = Math.pow(10, log - exp);
  
  if (coeff.toFixed(4) === "10.0000") {
    coeff = 1;
    exp += 1;
  }
  
  let coeffStr = coeff.toFixed(4);
  if (coeffStr === "1.0000") return `10^{${formatValueClean(exp)}}`;
  return `${coeffStr} \\times 10^{${formatValueClean(exp)}}`;
}

function renderHeight1(display, val) {
  const toLatexSci = (num) => {
    let str = String(num);
    if (str.includes('e')) {
      let [coeff, exp] = str.split('e');
      exp = exp.replace('+', '');
      if (coeff === '1') return `10^{${exp}}`;
      return `${coeff} \\times 10^{${exp}}`;
    }
    return typeof formatValueClean === 'function' ? formatValueClean(num) : str;
  };

  let exp = Math.floor(val);
  let coeff = Math.pow(10, val - exp);
  
  if (coeff.toFixed(4) === "10.0000") {
    coeff = 1;
    exp += 1;
  }
  
  let coeffStr = coeff.toFixed(4);
  let latex = coeffStr === "1.0000" ? `10^{${toLatexSci(exp)}}` : `${coeffStr} \\times 10^{${toLatexSci(exp)}}`;
  renderMath(display, latex);
}

// ============================================================================
// SECTION 4: THE OUTPUT RENDERING
// ============================================================================

function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  MathJax.typesetPromise([element]).catch((err) => console.log(err));
}
