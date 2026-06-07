// I use gemini to help me lmao

const PHI = (1 + Math.sqrt(5)) / 2;

// ============================================================================
// CALCULATION ENGINE
// ============================================================================

document.getElementById('calcInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    calculate(); 
  }
});

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

function calculate() {
  const inputEl = document.getElementById('calcInput');
  const displayEl = document.getElementById('outputDisplay');
  if (!inputEl || !displayEl) return;

  let expr = inputEl.value;

  try {
    if (!expr.trim()) {
      throw new Error("Please enter an expression");
    }

    let commaCheck = expr;
    commaCheck = commaCheck.replace(/(?:√|log)\([^)]*,[^)]*\)/g, '');
    if (commaCheck.includes(',')) {
      throw new Error("Syntax Error: Invalid use of comma");
    }

    // Implicit multiplication patches
    expr = expr.replace(/(\d+(?:\.\d+)?)([πeϕ∞√\(Γ]|sin|cos|tan|log|ln|gamma)/g, '$1*$2');
    expr = expr.replace(/([πeϕ∞\)])(\d+(?:\.\d+)?|[πeϕ∞√\(Γ]|sin|cos|tan|log|ln|gamma)/g, '$1*$2');

    // Factorial parsing
    expr = expr.replace(/(\d+(?:\.\d+)?|[πeϕ∞]|\((?:[^()]+|\([^()]*\))*\))!/g, 'factorial($1)');

    // Roots and functions
    expr = expr.replace(/√(\d+(?:\.\d+)?|[πeϕ∞])/g, '√($1)');
    expr = expr.replace(/√/g, 'root');
    expr = expr.replace(/log/g, 'log');
    expr = expr.replace(/tan/g, 'tan'); 
    expr = expr.replace(/Γ/g, 'gamma');
    
    // Constant swaps
    expr = expr.replace(/x/g, '*'); 
    expr = expr.replace(/π/g, 'Math.PI'); 
    expr = expr.replace(/e/g, 'Math.E'); 
    expr = expr.replace(/∞/g, 'Infinity'); 
    expr = expr.replace(/ϕ/g, 'PHI'); 

    // Trigonometry & Logarithms
    expr = expr.replace(/sin/g, 'Math.sin');
    expr = expr.replace(/cos/g, 'Math.cos');
    expr = expr.replace(/ln/g, 'Math.log');

    // Robust Right-to-Left Exponentiation Converter
    const expRegex = /(\w+(?:\.\w+)*\((?:[^()]+|\([^()]*\))*\)|\((?:[^()]+|\([^()]*\))*\)|\d+(?:\.\d+)?|[πeϕ∞])\^(-?(?:\w+(?:\.\w+)*\((?:[^()]+|\([^()]*\))*\)|\((?:[^()]+|\([^()]*\))*\)|\d+(?:\.\d+)?|[πeϕ∞]))(?![^^]*\^)/;
    
    // Loop only as long as there are VALID exponent patterns to replace
    while (expRegex.test(expr)) {
      expr = expr.replace(expRegex, 'exponentiation($1,$2)');
    }

    // If a '^' is STILL there, it means it's malformed (like `^ or ^`)
    if (expr.includes('^')) {
      throw new Error("Syntax Error: Malformed exponent");
    }

    // Native JS power patches (just in case raw ** is used)
    expr = expr.replace(/\*\*-\s*(\d+(?:\.\d+)?|[πeϕ∞]|\([^)]+\))/g, '**(-$1)');
    expr = expr.replace(/(?<![\d\)])-(\d+(?:\.\d+)?|[πeϕ∞]|\([^)]+\))\*\*(\d+(?:\.\d+)?|[πeϕ∞]|\([^)]+\))/g, '-($1**$2)');

    // Evaluate expression
    let rawResult = eval(expr);
    
    // Clear floating-point inaccuracies
    let result = cleanFloat(rawResult);

    // Format output
    let displayResult;
    if (result === Infinity) {
      displayResult = '\\infty';
    } else if (result === -Infinity) {
      displayResult = '-\\infty';
    } else if (isNaN(result)) {
      throw new Error("Invalid Calculation");
    } else {
      displayResult = scientificFormat(result);
    }

    displayEl.innerHTML = `\\[ ${displayResult} \\]`;

    if (window.MathJax) {
      window.MathJax.typesetPromise([displayEl]);
    }

  } catch (err) {
    // FIXED: Print errors as direct HTML text to stop MathJax from breaking on special symbols!
    displayEl.innerHTML = `<span style="color: #ff4d4d; font-family: system-ui, -apple-system, sans-serif; font-weight: 500;">Error: ${err.message}</span>`;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Factorial logic mapped directly through the shifted continuous Gamma function
function factorial(n) {
  if (n < 0 && Number.isInteger(n)) return NaN; // Factorials of negative integers are undefined
  return gamma(n + 1);
}

// The Ultimate Hybrid Gamma Function Γ(z)
// Combines Lanczos precision for small numbers with Stirling speed for large numbers!
function gamma(z) {
  // 1. SAFETY: Reflection Formula to handle negative numbers safely
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * customGamma(1 - z));
  }

  // 2. THE THRESHOLD: Determine which algorithm to use
  if (z <= 15) {
    // -> USE LANCZOS FOR SMALL NUMBERS (Flawless precision)
    const p = [
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      9.9843695780195716e-6,
      1.5056327351493116e-7
    ];
    let z_temp = z - 1;
    let x = p[0];
    for (let i = 1; i < p.length; i++) {
      x += p[i] / (z_temp + i);
    }
    let t = z_temp + 7 + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z_temp + 0.5) * Math.exp(-t) * x;
    
  } else {
    // -> USE STIRLING FOR LARGE NUMBERS (Blazing fast and accurate)
    return Math.sqrt((2 * Math.PI) / z) * Math.pow(z / Math.E, z);
  }
}

// Handles BOTH square roots √(x) and custom roots √(degree, number)
function root(a, b) {
  if (b === undefined) {
    return Math.sqrt(a);
  }
  return Math.pow(b, 1 / a);
}

// Handles BOTH standard log(x) [base 10] and custom log(base, number)
function log(a, b) {
  if (b === undefined) {
    return Math.log10(a);
  }
  return Math.log(b) / Math.log(a);
}

// FIX: Prevents tan(π/2) from blowing up into a weird 16-quadrillion number
function tan(x) {
  if (Math.abs(Math.cos(x)) < 1e-12) {
    return Infinity;
  }
  return Math.tan(x);
}

// FIX: Smashes floating-point fuzz (turns 4.999999999999999 into 5)
function cleanFloat(num) {
  if (typeof num !== 'number' || !isFinite(num)) return num;
  
  if (Math.abs(num - Math.round(num)) < 1e-12) {
    return Math.round(num);
  }
  
  if (Math.abs(num) < 1e12) {
    return parseFloat(num.toPrecision(12));
  }
  
  return num;
}

// ===================================================================
// GOOGOLOGY STUFF
// ===================================================================

function createTower(value, height) {
  return {
    value: value,
    height: height
  };
}

function exponentiation(a, b) {
  const predictedLog10 = b * Math.log10(a);
  
  if (predictedLog10 > 300) {
    return createTower(predictedLog10, 1);
  }
  return a**b;
}

// ===================================================================
// FORMAT STUFF
// ===================================================================

// Converts standard numbers to scientific notation AND handles Googology Tower Objects!
function scientificFormat(num) {
  // 1. Intercept Googology Tower Objects
  if (typeof num === 'object' && num !== null && 'value' in num) {
    // We recursively pass the internal value back through scientificFormat 
    // just in case the value itself is massive!
    let formattedValue = scientificFormat(num.value);
    return `E${formattedValue}\\#${num.height}`;
  }

  let str = num.toString();

  // If the number is beyond 10^10 or below 10^-6, force scientific notation
  if (Math.abs(num) >= 1e10 || (Math.abs(num) > 0 && Math.abs(num) <= 1e-6)) {
    // Keep up to 6 decimal places, but strip useless trailing zeros
    str = num.toExponential(6).replace(/\.?0+e/, 'e');
  }

  // Translate the "e" format into MathJax
  if (str.includes('e')) {
    let [base, exponent] = str.toLowerCase().split('e');
    exponent = parseInt(exponent, 10); 

    // Clean up "1 \times 10^b" or "-1 \times 10^b"
    if (base === '1') {
      return `10^{${exponent}}`;
    } else if (base === '-1') {
      return `-10^{${exponent}}`;
    }

    return `${base} \\times 10^{${exponent}}`;
  }

  return str;
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
