//format:
//n16 oscillatorTypes (2 bit for 3 oscillators)
//n16 oscillatorVols (2 bit for 3 oscillators)
//n16 oscillatorTunes (2 bit for 3 oscillators)
//n8 attack
//n8 decay
//n8 sustain
//n8 sustainDecay
//n8 cutoff
//ttvvttadssc (11 uncompressed bytes per oscillator)

////loadDat("ttvvttadssc");
////loadDat("30440454321");
////decodeChar(6, 2).concat(decodeChar(5, 3));
//decodeAll("30440454321", [[6,2],[5,3]]);

//0: 010 012 021 12345

function SimpleJSSynth(dest, opts) {
	// `dest` is the AudioNode destination
	// `opts` is an object; see notes further down for meaning and range of values.
	// {
	//   osc1type : 'sine'|'square'|'sawtooth'|'triangle', // type of wave
	//   osc1vol  : 0 to 1,                                // oscillator volume (linear)
	//   osc1tune : 0,                                     // relative tuning (semitones)
	//   osc2type, osc2vol, osc2tune,                      // settings for osc2
	//   osc3type, osc3vol, osc3tune,                      // settings for osc3
	//   attack   : 0 to inf,                              // attack time (seconds)
	//   decay    : 0 to inf,                              // decay time (seconds)
	//   sustain  : 0 to 1,                                // sustain (fraction of max vol)
	//   susdecay : 0 to inf,                              // decay during sustain (seconds)
	//   cutoff   : -inf to inf                            // filter cutoff (relative semitones)
	// }

	var ctx = dest.context;

	var filter = ctx.createBiquadFilter();
	filter.type = "lowpass";
	filter.frequency.setValueAtTime(22050, ctx.currentTime);
	filter.Q.setValueAtTime(0.5, ctx.currentTime);

	var gain = ctx.createGain();
	gain.gain.setValueAtTime(0, ctx.currentTime);
	gain.connect(filter);

	function oscgain(v) {
		var g = ctx.createGain();
		g.gain.setValueAtTime(0, ctx.currentTime);
		g.connect(gain);
		return { node: g, base: v };
	}
	var osc1gain = oscgain(opts.osc1vol);
	var osc2gain = oscgain(opts.osc2vol);
	var osc3gain = oscgain(opts.osc3vol);

	function osctype(type, g) {
		var osc = ctx.createOscillator();
		osc.type = type;
		osc.connect(g);
		return osc;
	}
	var osc1 = osctype(opts.osc1type, osc1gain.node);
	var osc2 = osctype(opts.osc2type, osc2gain.node);
	var osc3 = osctype(opts.osc3type, osc3gain.node);

	function calctune(t) {
		return 2 ** (t / 12);
	}
	var tune1 = calctune(opts.osc1tune);
	var tune2 = calctune(opts.osc2tune);
	var tune3 = calctune(opts.osc3tune);
	var cutoff = calctune(opts.cutoff);

	var attack   = opts.attack;
	var decay    = opts.decay;
	var sustain  = opts.sustain;
	var susdecay = opts.susdecay;

	var basefreq = 0;
	var silent = 0;
	var ndown = false;

	osc1.start();
	osc2.start();
	osc3.start();

	filter.connect(dest);

	filter.noteOn = function(freq, vol) {
		ndown = true;
		basefreq = freq;
		var now = ctx.currentTime;
		osc1.frequency.setValueAtTime(freq * tune1, now);
		osc2.frequency.setValueAtTime(freq * tune2, now);
		osc3.frequency.setValueAtTime(freq * tune3, now);
		filter.frequency.setValueAtTime(Math.min(freq * cutoff, 22050), now);
		osc1gain.node.gain.setValueAtTime(vol * osc1gain.base, now);
		osc2gain.node.gain.setValueAtTime(vol * osc2gain.base, now);
		osc3gain.node.gain.setValueAtTime(vol * osc3gain.base, now);
		var v = gain.gain.value;
		gain.gain.cancelScheduledValues(now);
		gain.gain.setValueAtTime(v, now);
		var hitpeak = now + attack;
		var hitsus = hitpeak + decay * (1 - sustain);
		silent = hitsus + susdecay;
		gain.gain.linearRampToValueAtTime(1, hitpeak);
		gain.gain.linearRampToValueAtTime(sustain, hitsus);
		gain.gain.linearRampToValueAtTime(0.000001, silent);
	};

	//unneeded
	//filter.bend = function(semitones) {
	//	var b = basefreq * Math.pow(2, semitones / 12);
	//	var now = ctx.currentTime;
	//	osc1.frequency.setTargetAtTime(b * tune1, now, 0.1);
	//	osc2.frequency.setTargetAtTime(b * tune2, now, 0.1);
	//	osc3.frequency.setTargetAtTime(b * tune3, now, 0.1);
	//};

	filter.noteOff = function() {
		ndown = false;
		var now = ctx.currentTime;
		var v = gain.gain.value;
		gain.gain.cancelScheduledValues(now);
		gain.gain.setValueAtTime(v, now);
		silent = now + decay * v;
		gain.gain.linearRampToValueAtTime(0.000001, silent);
	};

	filter.isReady = function() {
		return ctx.currentTime >= silent && !ndown;
	};

	filter.stop = function() {
		ndown = false;
		var now = ctx.currentTime;
		osc1gain.node.gain.setValueAtTime(0.000001, now);
		osc2gain.node.gain.setValueAtTime(0.000001, now);
		osc3gain.node.gain.setValueAtTime(0.000001, now);
		silent = 0;
	};

	filter.destroy = function() {
		ndown = false;
		silent = 0;
		osc1.stop();
		osc2.stop();
		osc3.stop();
		filter.disconnect();
	};

	return filter;
}

var actx = new AudioContext();
function createSynth(data) {
	var lut = ["sine", "square", "sawtooth", "triangle"];
	var decData = decodeAll("30440454321", [[6,2],[5,3]]);
	var s = SimpleJSSynth(actx.destination, {
	   osc1type: lut[decData[0]],
	   osc2type: lut[decData[1]],
	   osc3type: lut[decData[2]],
	   osc1vol: decData[3]/6,
	   osc2vol: decData[4]/6,
	   osc3vol: decData[5]/6,
	   osc1tune: decData[6]*12-12,
	   osc2tune: decData[7]*12-12,
	   osc3tune: decData[8]*12-12,
	   attack: decData[9]/5,
	   decay: decData[10]/1.4,
	   sustain: decData[11]/7,
	   susdecay: decData[12]*1.5,
	   cutoff: decData[13]*8-12
	});
	return s;
}

//createSynth("30440454321").noteOn(440, 0.5);