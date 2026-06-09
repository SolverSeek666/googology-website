// I use gemini to help me lmao

// ===================================================================
// MAIN STUFF
// ===================================================================

const PHI = (1 + Math.sqrt(5)) / 2;

/**
 * GOOGOLOGY CALCULATOR CORE ENGINE
 * Architecture: Math.js (Parser) + Break_Eternity.js (Big Double-Exponential Math)
 */

document.addEventListener("DOMContentLoaded", () => {
  const calcInput = document.getElementById("calcInput");
  const outputDisplay = document.getElementById("outputDisplay");

  if (!calcInput || !outputDisplay) return;

  // ==========================================
  // SECTION 1: GLOBAL UI HOOKS
  // ==========================================
  
  /**
   * Appends symbols or numbers directly into the input text area from UI buttons
   */
  window.appendInput = function(value) {
    calcInput.value += value;
    calcInput.focus();
  };


  // ==========================================
  // SECTION 2: THE PREPROCESSOR ENGINE
  // ==========================================

  /**
   * Translates visual keyboard symbols into tokens math.js can safely interpret.
   */
  function preprocessExpression(str) {
    let s = str.trim();

    // Standardize unicode constant symbols
    s = s.replace(/π/g, 'pi');
    s = s.replace(/ϕ/g, 'phi');
    s = s.replace(/∞/g, 'Infinity');
    s = s.replace(/Γ/g, 'gamma');

    // Standardize square root notations (handles both √5 and raw parenthetical bounds)
    s = s.replace(/√\(/g, 'sqrt(');
    s = s.replace(/√(\d+(?:\.\d+)?|[a-zA-Z]+)/g, 'sqrt($1)');

    // Resolve right-associative Knuth arrows (tetration towers)
    s = convertTetrationTowers(s);

    return s;
  }

  /**
   * Converts "a^^b^^c" into nested functions "tetrate(a, tetrate(b, c))"
   */
  function convertTetrationTowers(s) {
    while (s.includes('^^')) {
      let idx = s.lastIndexOf('^^');

      // Boundary scan left (base)
      let leftStart = idx - 1;
      let leftPenCount = 0;
      while (leftStart >= 0) {
        let char = s[leftStart];
        if (char === ')') leftPenCount++;
        else if (char === '(') leftPenCount--;

        if (leftPenCount === 0 && ['+', '-', '*', '/', '^', ','].includes(char)) {
          leftStart++;
          break;
        }
        if (leftStart === 0) break;
        leftStart--;
      }
      if (leftStart < 0) leftStart = 0;

      // Boundary scan right (exponent)
      let rightEnd = idx + 2;
      let rightPenCount = 0;
      while (rightEnd < s.length) {
        let char = s[rightEnd];
        if (char === '(') rightPenCount++;
        else if (char === ')') rightPenCount--;

        if (rightPenCount === 0 && ['+', '-', '*', '/', '^', ','].includes(char)) {
          rightEnd--;
          break;
        }
        rightEnd++;
      }
      if (rightEnd >= s.length) rightEnd = s.length - 1;

      let base = s.substring(leftStart, idx);
      let exponent = s.substring(idx + 2, rightEnd + 1);

      let replacement = `tetrate(${base},${exponent})`;
      s = s.substring(0, leftStart) + replacement + s.substring(rightEnd + 1);
    }
    return s;
  }


  // ==========================================
  // SECTION 3: RECURSIVE AST EVALUATOR
  // ==========================================

  /**
   * Safe Fractional Tetration Wrapper
   * Upgraded to use Universal Smooth Quadratic Approximation for arbitrary bases!
   */
  function safeTetrate(base, height) {
    let hNum = height.toNumber();

    // 1. If it's a clean integer, use the ultra-fast native engine
    if (Math.floor(hNum) === hNum) {
      return base.tetrate(hNum);
    }

    // 2. Handle extreme heights (Infinity/NaN) safely
    if (!isFinite(hNum)) {
      return base.tetrate(hNum);
    }

    // Extract the integer floor and the fractional remainder (0 <= frac < 1)
    let floorH = Math.floor(hNum);
    let frac = hNum - floorH; 

    let bNum = base.toNumber();
    let result;

    // 3. Compute the smooth base case value on the standard [0, 1) interval
    if (bNum > 1) {
      let lnB = Math.log(bNum);
      
      // Calculate universal C1 continuity slopes dynamically for this base
      let B = (2 * (bNum - 1)) / (bNum * lnB + 1);
      let A = (bNum - 1) - B;
      
      // Evaluate our smooth blending polynomial curve: A*f^2 + B*f + 1
      let polyVal = A * frac * frac + B * frac + 1;
      result = new Decimal(polyVal);
    } else {
      // Fallback configuration if the base is <= 1 (where logarithms/tetration break)
      result = new Decimal(1 + frac * (bNum - 1));
    }

    // 4. Climb up or down the power tower from our [0, 1) base coordinate
    if (floorH >= 0) {
      // Positive height scaling: execute base.pow() upward
      for (let i = 0; i < floorH; i++) {
        result = base.pow(result);
      }
    } else {
      // Negative height scaling: execute log_base() downward
      let steps = -floorH;
      let logBase = base.log10(); // Cached change-of-base rule asset
      
      for (let i = 0; i < steps; i++) {
        if (result.lte(0)) {
          return new Decimal(-Infinity); 
        }
        result = result.log10().div(logBase);
      }
    }

    return result;
  }

  /**
   * Traverses math.js parsed syntax nodes and resolves them using break_eternity.js
   */
  function evaluateAST(node, scope = {}) {
    switch (node.type) {
      
      // Numbers
      case 'ConstantNode':
        return new Decimal(node.value);

      // Constants & Named Symbols
      case 'SymbolNode':
        if (scope[node.name] !== undefined) return new Decimal(scope[node.name]);
        switch (node.name) {
          case 'pi': return new Decimal(Math.PI);
          case 'e': return new Decimal(Math.E);
          case 'phi': return new Decimal(1.618033988749895);
          case 'Infinity': return new Decimal(Infinity);
          default: throw new Error(`Unknown variable: ${node.name}`);
        }

      // Syntax formatting blocks
      case 'ParenthesisNode':
        return evaluateAST(node.content, scope);

      // Math Operators (+, -, *, /, ^, !)
      case 'OperatorNode':
        const args = node.args.map(arg => evaluateAST(arg, scope));
        
        // Unary operations (e.g., negative scaling (-5) or factorials (5!))
        if (node.args.length === 1) {
          if (node.op === '-') return args[0].neg();
          if (node.op === '+') return args[0];
          if (node.op === '!') return args[0].add(1).gamma(); 
        }
        
        // Binary operations
        switch (node.op) {
          case '+': return args[0].add(args[1]);
          case '-': return args[0].sub(args[1]);
          case '*': return args[0].mul(args[1]);
          case '/': return args[0].div(args[1]);
          case '^': return args[0].pow(args[1]);
          default: throw new Error(`Unsupported operator: ${node.op}`);
        }

      // Functional evaluation nodes (log, sqrt, tetrate)
      case 'FunctionNode':
        const funcArgs = node.args.map(arg => evaluateAST(arg, scope));
        switch (node.name) {
          case 'sqrt':
            if (funcArgs.length === 1) return funcArgs[0].sqrt();
            if (funcArgs.length === 2) return funcArgs[0].pow(new Decimal(1).div(funcArgs[1])); 
            throw new Error("sqrt expects 1 or 2 arguments");
          case 'log':
            if (funcArgs.length === 1) return funcArgs[0].log10();
            if (funcArgs.length === 2) return funcArgs[0].log10().div(funcArgs[1].log10()); 
            throw new Error("log expects 1 or 2 arguments");
          case 'ln': return funcArgs[0].ln();
          case 'gamma': return funcArgs[0].gamma();
          case 'sin': return funcArgs[0].sin();
          case 'cos': return funcArgs[0].cos();
          case 'tan': return funcArgs[0].tan();
          case 'tetrate': 
            // FIXED: Now routes through our safe custom fractional handler
            return safeTetrate(funcArgs[0], funcArgs[1] ? funcArgs[1] : new Decimal(1));
          default: throw new Error(`Unsupported function: ${node.name}`);
        }

      default:
        throw new Error(`Syntax Error`);
    }
  }

  // ==========================================
  // SECTION 4: LATEX FORMATTING LAYER
  // ==========================================

  /**
   * Formats astronomical numbers into beautiful vertical LaTeX exponent stacks.
   */
  function formatDecimalToLaTeX(d) {
    if (Number.isNaN(d.mag) || Number.isNaN(d.layer)) return '\\text{NaN}';
    if (!isFinite(d.layer) || !isFinite(d.mag)) return '\\infty';

    // Tier 1: Small everyday values
    if (d.layer === 0 && d.mag < 1e10 && d.mag > 1e-6) {
      let num = d.toNumber();
      if (Math.abs(num - Math.round(num)) < 1e-11) num = Math.round(num);
      return num.toString();
    }

    // Tier 2: Traditional Scientific Notation (e.g., 3.45 x 10^400)
    if (d.layer === 1 && d.mag < 1e9) {
      let exp = Math.floor(d.mag);
      let mantissa = parseFloat(Math.pow(10, d.mag - exp).toFixed(4));
      if (mantissa === 10) { mantissa = 1; exp += 1; }
      if (mantissa === 1) return `10^{${exp}}`;
      return `${mantissa} \\times 10^{${exp}}`;
    }

    // Tier 3: Cosmological Power Towers (e.g., 10^10^10^5.4)
    let tower = "";
    for (let i = 0; i < d.layer; i++) tower += "10^{";
    tower += parseFloat(d.mag.toFixed(4)).toString();
    for (let i = 0; i < d.layer; i++) tower += "}";
    return tower;
  }


  // ==========================================
  // SECTION 5: CALCULATION TRIGGER LOOP
  // ==========================================

  // Listens for 'Enter' key updates inside input bar
  calcInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const rawInput = calcInput.value;
      if (!rawInput.trim()) return;

      try {
        // Pipeline: Clean -> Parse -> Evaluate -> Format LaTeX
        const cleanExpression = preprocessExpression(rawInput);
        const ast = math.parse(cleanExpression);
        const result = evaluateAST(ast);
        const laTeX = formatDecimalToLaTeX(result);

        // Inject and update MathJax display layout
        outputDisplay.innerHTML = `\\[ ${laTeX} \\]`;

        if (window.MathJax && window.MathJax.typesetPromise) {
          MathJax.typesetPromise([outputDisplay]);
        }
      } catch (err) {
        // Graceful error layout output
        outputDisplay.innerHTML = `<span style="color: #ff4d4d; font-family: 'JetBrains Mono', monospace; font-size: 14px;">Error: ${err.message}</span>`;
      }
    }
  });
});

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
