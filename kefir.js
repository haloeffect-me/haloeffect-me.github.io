document.documentElement.classList.add("js");

const bacteriaGramsInput = document.querySelector("#bacteria-grams");
const waterResult = document.querySelector("#water-result");
const sugarResult = document.querySelector("#sugar-result");
const recipeMessage = document.querySelector("#recipe-message");

function formatGrams(value) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} g`;
}

function updateRecipeCalculator() {
  const bacteria = Number(bacteriaGramsInput.value);

  if (!bacteriaGramsInput.value.trim()) {
    waterResult.textContent = "—";
    sugarResult.textContent = "—";
    recipeMessage.textContent = "Enter a bacteria amount to begin.";
    return;
  }

  if (!Number.isFinite(bacteria) || bacteria < 0) {
    waterResult.textContent = "—";
    sugarResult.textContent = "—";
    recipeMessage.textContent = "Please enter an amount of 0 g or more.";
    return;
  }

  waterResult.textContent = formatGrams((bacteria * 500) / 30);
  sugarResult.textContent = formatGrams((bacteria * 25) / 30);
  recipeMessage.textContent = `For ${formatGrams(bacteria)} of bacteria.`;
}

bacteriaGramsInput.addEventListener("input", updateRecipeCalculator);

const revealTargets = document.querySelectorAll(".reveal");
revealTargets.forEach((target) => target.classList.add("is-visible"));
