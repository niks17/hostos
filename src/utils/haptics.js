/**
 * haptics.js — Haptički feedback za mobilne uređaje
 *
 * Koristi Web Vibration API (navigator.vibrate).
 * Tiho pada na uređajima koji ne podržavaju API (desktop, iOS Safari).
 *
 * iOS napomena: Safari ne podržava navigator.vibrate — nema efekta,
 * ali ne baca grešku. Android Chrome i Firefox podržavaju.
 */

function vibrate(pattern) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  } catch (e) {
    // Tihо ignorišemo — vibration je progressive enhancement
  }
}

export const haptic = {
  // Kratki tap — za checklist stavke, toggle dugmad
  tap: () => vibrate(50),

  // Dupli puls — za uspešan workflow / potvrdu rezervacije
  success: () => vibrate([60, 40, 60]),

  // Jači puls — za završetak kompletnog čišćenja
  done: () => vibrate([80, 30, 80, 30, 120]),

  // Greška — za rollback / neuspeh
  error: () => vibrate([100, 50, 100]),
}
