function _tone(freq, dur, type = "sine", vol = 0.25) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
    setTimeout(() => ctx.close(), (dur + 0.1) * 1000);
  } catch {}
}

export const playSounds = {
  questComplete:      () => { _tone(523,0.08); setTimeout(()=>_tone(659,0.08),90); setTimeout(()=>_tone(784,0.15),180); },
  allDailiesComplete: () => { [392,494,587,784,988].forEach((f,i)=>setTimeout(()=>_tone(f,0.12,"triangle"),i*70)); },
  levelUp:            () => { [330,415,494,659,830,988].forEach((f,i)=>setTimeout(()=>_tone(f,0.14,"triangle",0.3),i*60)); },
  lootDrop:           () => { [440,554,659].forEach((f,i)=>setTimeout(()=>_tone(f,0.2,"square",0.12),i*55)); },
  spellCast:          () => { [880,1109,1320,880].forEach((f,i)=>setTimeout(()=>_tone(f,0.08,"sawtooth",0.1),i*35)); },
};
