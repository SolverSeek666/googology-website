// Game values managed using break_eternity.js
let game = {
    numbers: new Decimal(0),
    upgrade1Cost: new Decimal(0),
    upgrade1Count: 0, // Track integer counter for purchase cap limits
    upgrade1Max: 3,
    productionPerUpgrade: new Decimal(0.01) // Changed base generation to 0.01/s
};

// Target DOM interface nodes
const numberCountEl = document.getElementById("number-count");
const upgradeBtn1 = document.getElementById("upgrade-btn-1");
const upgradeCount1El = document.getElementById("upgrade-count-1");
const upgradeCost1El = document.getElementById("upgrade-cost-1");
const upgradeCostContainer1 = document.getElementById("upgrade-cost-container-1");

// Number formatting tool holding to a maximum display cap of 3 decimal digits
function formatDisplay(decimalValue) {
    if (decimalValue.lt(1e9)) {
        return decimalValue.toFixed(3);
    }
    return decimalValue.toString();
}

// Global UI renderer update loop
function updateDisplay() {
    numberCountEl.innerText = formatDisplay(game.numbers);
    upgradeCount1El.innerText = game.upgrade1Count;

    if (game.upgrade1Count >= game.upgrade1Max) {
        upgradeCostContainer1.innerText = "Upgrade Maxed";
        upgradeBtn1.disabled = true;
    } else {
        upgradeCost1El.innerText = game.upgrade1Cost.toString();
    }
}

// Logic validation handling user clicks on the upgrade card
upgradeBtn1.addEventListener("click", () => {
    // Escape action loops early if the feature has reached max tier restrictions
    if (game.upgrade1Count >= game.upgrade1Max) return;

    if (game.numbers.gte(game.upgrade1Cost)) {
        game.numbers = game.numbers.sub(game.upgrade1Cost);
        game.upgrade1Count += 1;
        
        // Progressive price scaling system for remaining available tiers
        if (game.upgrade1Count < game.upgrade1Max) {
            if (game.upgrade1Cost.eq(0)) {
                game.upgrade1Cost = new Decimal(0.05); // Next purchase threshold configuration
            } else {
                game.upgrade1Cost = game.upgrade1Cost.mul(3.5); // Exponential growth scaling variables
            }
        }
        
        updateDisplay();
    }
});

// Time tracking and generation loop variables
let lastUpdateTime = Date.now();

setInterval(() => {
    let now = Date.now();
    let diff = (now - lastUpdateTime) / 1000;
    lastUpdateTime = now;

    if (game.upgrade1Count > 0) {
        // Core tracking formula calculation: Count * 0.01 * Delta Time Frame Interval
        let passiveGain = new Decimal(game.upgrade1Count).mul(game.productionPerUpgrade).mul(diff);
        game.numbers = game.numbers.add(passiveGain);
        updateDisplay();
    }
}, 50);

// Initialize visual view state parameters
updateDisplay();
