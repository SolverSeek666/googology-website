document.getElementById('calcInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const input = this.value.trim();
    if (input) {
      processGoogology(input);
    }
  }
});

function processGoogology(rawInput) {
  const display = document.getElementById('outputDisplay');
  let cleanInput = rawInput.toLowerCase().replace(/\s+/g, '');
  
  // Easter Egg/Shortcut lookup for famous Googology numbers
  if (cleanInput === 'googol') {
    renderMath(display, `10^{100}`);
    return;
  }
  if (cleanInput === 'googolplex') {
    renderMath(display, `10^{10^{100}}`);
    return;
  }
  if (cleanInput === 'googolduplex') {
    renderMath(display, `10^{10^{10^{100}}}`);
    return;
  }

  // Handle Power Towers (e.g., 10^10^5)
  if (cleanInput.includes('^')) {
    const parts = rawInput.split('^');
    
    // Build a nested LaTeX tower string dynamically
    // E.g., ['10', '10', '5'] becomes 10^{10^{5}}
    let latexString = parts[parts.length - 1];
    for (let i = parts.length - 2; i >= 0; i--) {
      latexString = `${parts[i]}^{${latexString}}`;
    }
    
    renderMath(display, latexString);
    return;
  }

  // Fallback for normal mathematical inputs
  try {
    // Using a safe Function constructor evaluation for standard math
    let evaluation = Function(`"use strict"; return (${cleanInput})`)();
    
    if (evaluation === Infinity || evaluation === -Infinity) {
      renderMath(display, `\\text{Overflow Avoided! Number is too massive.}`);
    } else {
      renderMath(display, evaluation.toString());
    }
  } catch (error) {
    renderMath(display, `\\text{Error: Invalid Expression}`);
  }
}

// Safely pass LaTeX strings to MathJax 3.x framework for live rendering
function renderMath(element, latex) {
  element.innerHTML = `\\[ ${latex} \\]`;
  // Tells MathJax to look at the updated div and convert it to nice graphics
  MathJax.typesetPromise([element]).catch((err) => console.log(err));
}