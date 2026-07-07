// I use typin_ to help me lmao

appendInput = function(stuff) {
    calcInput.value += stuff;
}

calcInput.onkeydown = function(e) {
	// console.log(e.key);
	if (e.key != "Enter") return;
	calcInput = calcInput.replaceAll("e", "math.e");
	calcInput = calcInput.replaceAll("π", "math.pi");
	calcInput = calcInput.replaceAll("ϕ", "math.phi");
	calcInput = calcInput.replaceAll("∞", "math.Infinity");
	calcInput = calcInput.replaceAll(/√\(([\w.]+),([\w.]+)\)/g, "math.nthRoot($1,$2)");
    calcInput = calcInput.replaceAll(/√([\w.]+)/g, 'math.sqrt($1)');
    calcInput = calcInput.replaceAll(/log\(([\w.]+),([\w.]+)\)/g, "math.log($1,$2)");
    calcInput = calcInput.replaceAll(/log\(([\w.]+)\)/g, 'math.log10($1)');
	calcInput = calcInput.replaceAll(/ln\(([\w.]+)\)/g, 'math.log($1)');
	calcInput = calcInput.replaceAll(/sin\(([\w.]+)\)/g, 'math.sin($1)');
	calcInput = calcInput.replaceAll(/cos\(([\w.]+)\)/g, 'math.cos($1)');
	calcInput = calcInput.replaceAll(/tan\(([\w.]+)\)/g, 'math.tan($1)');
	calcInput = calcInput.replaceAll(/([\w.]+)!/g, 'math.factorial($1)');
	calcInput = calcInput.replaceAll(/Γ\(([\w.]+)\)/g, 'math.gamma($1)');
	document.getElementById("calcOutput").innerHTML = Number(math.evaluate("calcInput.value").toFixed(10));
}
