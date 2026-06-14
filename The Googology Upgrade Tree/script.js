// Game State tracking via break_eternity.js
let game = {
    numbers: new Decimal(0),
    upgrade1Cost: new Decimal(0), // Starts at 0 cost!
    upgrade1Count: new Decimal(0),
    productionPerUpgrade: new Decimal(0.001)
};

// DOM Element Targets
const numberCountEl = document.getElementById("number-count");
const upgradeBtn1 = document.getElementById("upgrade-btn-1");
const upgradeCost1El = document.getElementById("upgrade-cost-1");

// Formatter to strictly enforce your max 3 decimal digits rule
function formatDisplay(decimalValue) {
    // If the number is small, show exactly 3 decimal spots
    if (decimalValue.lt(1e9)) {
        return decimalValue.toFixed(3);
    }
    // Safeguard for later when Googology scale completely breaks standard decimals
    return decimalValue.toString();
}

// Update the elements visible on screen
function updateDisplay() {
    numberCountEl.innerText = formatDisplay(game.numbers);
    upgradeCost1El.innerText = game.upgrade1Cost.toString();
}

// Purchase Handler
upgradeBtn1.addEventListener("click", () => {
    if (game.numbers.gte(game.upgrade1Cost)) {
        game.numbers = game.numbers.sub(game.upgrade1Cost);
        game.upgrade1Count = game.upgrade1Count.add(1);
        
        // After buying it for 0, increase the cost so the next ones aren't free!
        if (game.upgrade1Cost.eq(0)) {
            game.upgrade1Cost = new Decimal(0.005); // Next one costs a tiny fraction
        } else {
            game.upgrade1Cost = game.upgrade1Cost.mul(1.5); // Scales up exponentially
        }
        
        updateDisplay();
    }
});

// Real-time Delta Game Loop
let lastUpdateTime = Date.now();

setInterval(() => {
    let now = Date.now();
    // Calculate fractional seconds elapsed since last frame tick
    let diff = (now - lastUpdateTime) / 1000; 
    lastUpdateTime = now;

    // Production calculation: (Count * 0.001) * time passed
    if (game.upgrade1Count.gt(0)) {
        let passiveGain = game.upgrade1Count.mul(game.productionPerUpgrade).mul(diff);
        game.numbers = game.numbers.add(passiveGain);
        updateDisplay();
    }
}, 50); // Runs 20 times a second for flawless processing

// Initial run to show 0.000 instantly
updateDisplay();
