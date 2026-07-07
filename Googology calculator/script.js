// I use typin_ to help me lmao

appendInput = function(stuff) {
    calcInput.value += stuff;
}

calcInput.onkeydown = function(e) {
	// console.log(e.key);
	if (e.key != "Enter") return;
	transform = calcInput.value
	transform = transform.replaceAll("e", "math.e");
	transform = transform.replaceAll("π", "math.pi");
	transform = transform.replaceAll("ϕ", "math.phi");
	transform = transform.replaceAll("∞", "math.Infinity");
	transform = transform.replaceAll(/√\(([\w.]+),([\w.]+)\)/g, "math.nthRoot($1,$2)");
    transform = transform.replaceAll(/√([\w.]+)/g, 'math.sqrt($1)');
    transform = transform.replaceAll(/log\(([\w.]+),([\w.]+)\)/g, "math.log($1,$2)");
  	transform = transform.replaceAll(/log\(([\w.]+)\)/g, 'math.log10($1)');
	transform = transform.replaceAll(/ln\(([\w.]+)\)/g, 'math.log($1)');
	transform = transform.replaceAll(/sin\(([\w.]+)\)/g, 'math.sin($1)');
	transform = transform.replaceAll(/cos\(([\w.]+)\)/g, 'math.cos($1)');
	transform = transform.replaceAll(/tan\(([\w.]+)\)/g, 'math.tan($1)');
	transform = transform.replaceAll(/([\w.]+)!/g, 'math.factorial($1)');
	transform = transform.replaceAll(/Γ\(([\w.]+)\)/g, 'math.gamma($1)');
	document.getElementById("calcOutput").innerHTML = Number(math.evaluate(transform).toFixed(10));
}
