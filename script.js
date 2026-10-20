const languages = [
  ["auto", "Detect language"], ["af", "Afrikaans"], ["sq", "Albanian"], ["am", "Amharic"],
  ["ar", "Arabic"], ["hy", "Armenian"], ["az", "Azerbaijani"], ["eu", "Basque"],
  ["be", "Belarusian"], ["bn", "Bengali"], ["bs", "Bosnian"], ["bg", "Bulgarian"],
  ["my", "Burmese"], ["ca", "Catalan"], ["zh-CN", "Chinese (Simplified)"], ["zh-TW", "Chinese (Traditional)"],
  ["hr", "Croatian"], ["cs", "Czech"], ["da", "Danish"], ["nl", "Dutch"],
  ["en", "English"], ["et", "Estonian"], ["tl", "Filipino"], ["fi", "Finnish"],
  ["fr", "French"], ["gl", "Galician"], ["ka", "Georgian"], ["de", "German"],
  ["el", "Greek"], ["gu", "Gujarati"], ["ht", "Haitian Creole"], ["ha", "Hausa"],
  ["he", "Hebrew"], ["hi", "Hindi"], ["hu", "Hungarian"], ["is", "Icelandic"],
  ["ig", "Igbo"], ["id", "Indonesian"], ["ga", "Irish"], ["it", "Italian"],
  ["ja", "Japanese"], ["jv", "Javanese"], ["kn", "Kannada"], ["kk", "Kazakh"],
  ["km", "Khmer"], ["ko", "Korean"], ["lo", "Lao"], ["lv", "Latvian"],
  ["lt", "Lithuanian"], ["mk", "Macedonian"], ["mg", "Malagasy"], ["ms", "Malay"],
  ["ml", "Malayalam"], ["mt", "Maltese"], ["mi", "Maori"], ["mr", "Marathi"],
  ["mn", "Mongolian"], ["ne", "Nepali"], ["no", "Norwegian"], ["ps", "Pashto"],
  ["fa", "Persian"], ["pl", "Polish"], ["pt", "Portuguese"], ["pa", "Punjabi"],
  ["ro", "Romanian"], ["ru", "Russian"], ["sr", "Serbian"], ["st", "Sesotho"],
  ["si", "Sinhala"], ["sk", "Slovak"], ["sl", "Slovenian"], ["so", "Somali"],
  ["es", "Spanish"], ["su", "Sundanese"], ["sw", "Swahili"], ["sv", "Swedish"],
  ["tg", "Tajik"], ["ta", "Tamil"], ["te", "Telugu"], ["th", "Thai"],
  ["tr", "Turkish"], ["uk", "Ukrainian"], ["ur", "Urdu"], ["uz", "Uzbek"],
  ["vi", "Vietnamese"], ["cy", "Welsh"], ["xh", "Xhosa"], ["yo", "Yoruba"], ["zu", "Zulu"]
];

const sourceLanguage = document.querySelector("#source-language");
const targetLanguage = document.querySelector("#target-language");
const sourceText = document.querySelector("#source-text");
const translatedText = document.querySelector("#translated-text");
const translateButton = document.querySelector("#translate-button");
const translationStatus = document.querySelector("#translation-status");
const copyButton = document.querySelector("#copy-translation");
const charCount = document.querySelector("#char-count");
const toast = document.querySelector("#toast");
let toastTimeout;

function populateLanguages(select, selectedCode) {
  for (const [code, name] of languages) {
    if (select === targetLanguage && code === "auto") continue;
    const option = document.createElement("option");
    option.value = code;
    option.textContent = name;
    select.append(option);
  }
  select.value = selectedCode;
}

populateLanguages(sourceLanguage, "auto");
populateLanguages(targetLanguage, "es");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("visible"), 2800);
}

function setTranslatedText(text, placeholder = false) {
  translatedText.textContent = text;
  translatedText.classList.toggle("placeholder-text", placeholder);
  copyButton.disabled = placeholder || !text;
}

sourceText.addEventListener("input", () => {
  charCount.textContent = `${sourceText.value.length} / 5000`;
});

document.querySelector("#clear-text").addEventListener("click", () => {
  sourceText.value = "";
  charCount.textContent = "0 / 5000";
  setTranslatedText("Your translation will appear here.", true);
  translationStatus.textContent = "Ready to translate";
  sourceText.focus();
});

document.querySelector("#swap-languages").addEventListener("click", () => {
  if (sourceLanguage.value === "auto") {
    showToast("Choose a source language before swapping.");
    return;
  }
  const previousSource = sourceLanguage.value;
  sourceLanguage.value = targetLanguage.value;
  targetLanguage.value = previousSource;

  const previousText = sourceText.value;
  sourceText.value = translatedText.classList.contains("placeholder-text") ? "" : translatedText.textContent;
  setTranslatedText(previousText || "Your translation will appear here.", !previousText);
  charCount.textContent = `${sourceText.value.length} / 5000`;
});

async function translate() {
  const text = sourceText.value.trim();
  if (!text) {
    showToast("Enter some text to translate.");
    sourceText.focus();
    return;
  }

  translateButton.disabled = true;
  translateButton.classList.add("loading");
  translateButton.querySelector("span").textContent = "Translating";
  translationStatus.textContent = "Translating...";

  try {
    const params = new URLSearchParams({
      client: "gtx",
      sl: sourceLanguage.value,
      tl: targetLanguage.value,
      dt: "t",
      q: text
    });
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`);
    if (!response.ok) throw new Error(`Translation service returned ${response.status}.`);
    const data = await response.json();
    const result = data[0]?.map(segment => segment[0]).join("");
    if (!result) throw new Error("The translation service could not translate this text.");

    setTranslatedText(result);
    translationStatus.textContent = "Translation complete";
  } catch (error) {
    translationStatus.textContent = "Translation failed";
    showToast(error instanceof Error ? error.message : "Could not connect to the translation service.");
  } finally {
    translateButton.disabled = false;
    translateButton.classList.remove("loading");
    translateButton.querySelector("span").textContent = "Translate";
  }
}

translateButton.addEventListener("click", translate);
sourceText.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") translate();
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(translatedText.textContent);
    showToast("Translation copied to clipboard.");
  } catch {
    showToast("Clipboard access is unavailable in this browser.");
  }
});
