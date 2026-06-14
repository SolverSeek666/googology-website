let game = {
    numbers: new Decimal(0),
    upgrade1Cost: new Decimal(0),
    upgrade1Count: 0,
    upgrade1Max: 1, // Changed maximum cap to 1
    productionPerUpgrade: new Decimal(0.01), // Set to 0.01 to match your [base: 0.01/s] text
    
    // Your new future-proofing variables!
    add: new Decimal(1),
    mult: new Decimal(1),
    exp: new Decimal(1)
};

const numberCountEl = document.getElementById("number-count");
const rateDisplayEl = document.getElementById("rate-display"); // New element target
const upgradeBtn1 = document.getElementById("upgrade-btn-1");
const upgradeCount1El = document.getElementById("upgrade-count-1");
const upgradeCost1El = document.getElementById("upgrade-cost-1");
const upgradeCostContainer1 = document.getElementById("upgrade-cost-container-1");

function formatDisplay(decimalValue) {
    if (decimalValue.lt(1e9)) {
        return decimalValue.toFixed(3);
    }
    return decimalValue.toString();
}

function updateDisplay() {
    numberCountEl.innerText = formatDisplay(game.numbers);
    upgradeCount1El.innerText = game.upgrade1Count;

    // Calculate current NPS (Numbers Per Second)
    let currentNps = new Decimal(game.upgrade1Count).mul(game.productionPerUpgrade);
    
    // Update the visual rate display using your exact requested format
    rateDisplayEl.innerText = `+${formatDisplay(currentNps)}/s [+${game.add}|×${game.mult}|^${game.exp}]`;

    if (game.upgrade1Count >= game.upgrade1Max) {
        upgradeCostContainer1.innerText = "Upgrade Maxed"; // Changed to Uppercase
        upgradeBtn1.disabled = true;
    } else {
        upgradeCost1El.innerText = game.upgrade1Cost.toString();
    }
}

upgradeBtn1.addEventListener("click", () => {
    if (game.upgrade1Count >= game.upgrade1Max) return;

    if (game.numbers.gte(game.upgrade1Cost)) {
        game.numbers = game.numbers.sub(game.upgrade1Cost);
        game.upgrade1Count += 1;
        
        // This won't trigger anymore since max is 1, but it's safe to leave for future upgrades
        if (game.upgrade1Count < game.upgrade1Max) {
            if (game.upgrade1Cost.eq(0)) {
                game.upgrade1Cost = new Decimal(0.05);
            } else {
                game.upgrade1Cost = game.upgrade1Cost.mul(3.5);
            }
        }
        
        updateDisplay();
    }
});

let lastUpdateTime = Date.now();

setInterval(() => {
    let now = Date.now();
    let diff = (now - lastUpdateTime) / 1000;
    lastUpdateTime = now;

    if (game.upgrade1Count > 0) {
        let passiveGain = new Decimal(game.upgrade1Count).mul(game.productionPerUpgrade).mul(diff);
        game.numbers = game.numbers.add(passiveGain);
        updateDisplay();
    }
}, 50);

updateDisplay();
