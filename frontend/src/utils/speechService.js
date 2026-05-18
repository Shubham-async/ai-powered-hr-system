// speechService.js

let selectedVoice = null;

/**
 * Load and cache preferred voice
 */
export const initVoice = () => {
  const voices = window.speechSynthesis.getVoices();

  // Prefer Microsoft Zira
  selectedVoice =
    voices.find(
      (voice) =>
        voice.name === "Microsoft Zira - English (United States)"
    ) ||
    voices.find((voice) => voice.name.includes("Zira")) ||
    voices.find((voice) => voice.name.includes("Google")) ||
    voices[0];
};

/**
 * Speak text with professional HR tuning
 */
export const speak = (text, options = {}) => {
  const synth = window.speechSynthesis;

  if (!synth) return;

  // Stop previous speech
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance();

  // Ensure voices are loaded
  if (!selectedVoice) {
    initVoice();
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  // HR Professional tuning
  utterance.rate = options.rate || 0.88;
  utterance.pitch = options.pitch || 1.08;
  utterance.volume = 1;

  // Natural pauses
  utterance.text = text
    .replace(/\./g, ". ")
    .replace(/,/g, ", ")
    .replace(/\?/g, "? ");

  // Slight delay for natural feeling
  setTimeout(() => {
    synth.speak(utterance);
  }, 300);
};

/**
 * Stop any current speech (Barge-in)
 */
export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};