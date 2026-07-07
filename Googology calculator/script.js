// I use typin_ to help me lmao

appendInput = function(stuff) {
    calcInput.value += stuff;
}

calcInput.onkeydown = function(e) {
	// console.log(e.key);
	if (e.key != "Enter") return;
	calcInput.value = calcInput.value.replaceAll("e", "math.e");
	calcInput.value = calcInput.value.replaceAll("π", "math.pi");
	calcInput.value = calcInput.value.replaceAll("ϕ", "math.phi");
	calcInput.value = calcInput.value.replaceAll("∞", "math.Infinity");
	calcInput.value = calcInput.value.replaceAll(/√\(([\w.]+),([\w.]+)\)/g, "math.nthRoot($1,$2)");
    calcInput.value = calcInput.value.replaceAll(/√([\w.]+)/g, 'math.sqrt($1)');
    calcInput.value = calcInput.value.replaceAll(/log\(([\w.]+),([\w.]+)\)/g, "math.log($1,$2)");
  	calcInput.value = calcInput.value.replaceAll(/log\(([\w.]+)\)/g, 'math.log10($1)');
	calcInput.value = calcInput.value.replaceAll(/ln\(([\w.]+)\)/g, 'math.log($1)');
	calcInput.value = calcInput.value.replaceAll(/sin\(([\w.]+)\)/g, 'math.sin($1)');
	calcInput.value = calcInput.value.replaceAll(/cos\(([\w.]+)\)/g, 'math.cos($1)');
	calcInput.value = calcInput.value.replaceAll(/tan\(([\w.]+)\)/g, 'math.tan($1)');
	calcInput.value = calcInput.value.replaceAll(/([\w.]+)!/g, 'math.factorial($1)');
	calcInput.value = calcInput.value.replaceAll(/Γ\(([\w.]+)\)/g, 'math.gamma($1)');
	document.getElementById("calcOutput").innerHTML = Number(math.evaluate("calcInput.value").toFixed(10));
}
