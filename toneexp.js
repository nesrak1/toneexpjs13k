//ported from go

var ctx, can2d;
var scx, scy, cmx, cmy, md, mjd, mju, rmd, rmju, rmjd, mft;
var kdwn = {};
var scrx, scry;
var notes = [];
var curSel = null;
var curNote = null;
var curInst = 0; //cur inst in the right piano roll
var curNoteStart = 0;
var curOsc = 0; //cur inst in the left editor
var end = 1;
var step = 4;
var oscs = [];
var oscDatas = [];
var playLoop = null;
var clipboard = [];
var clipboardPos = 0;
var instColors = [["#e62937", "#b8202c"], ["#ffa100", "#cc8000"], ["#fdf900", "#cac700"], ["#00e430", "#00b626"], ["#0079f1", "#0060c0"], ["#c87aff", "#a061cc"]];
var width = 960, height = 720;

function setuptone() {
	can2d = document.getElementById("e");
	ctx = can2d.getContext("2d");
	
	can2d.addEventListener("mousemove", mousemove, false);
	can2d.addEventListener("mousedown", mousedown, false);
	document.addEventListener("mouseup", mouseup, false);
	can2d.addEventListener("contextmenu", contextmenu, false);
	can2d.addEventListener("wheel", mousescroll, false);
	document.addEventListener("keydown", keydown);
	document.addEventListener("keyup", keyup);
	
	["osc1type", "osc1vol", "osc1tune", "osc2type", "osc2vol", "osc2tune", "osc3type", "osc3vol", "osc3tune",
	 "attack", "decay", "sustain", "susdecay", "cutoff"].forEach(function(id) {
		document.getElementById(id).addEventListener("change", reloadOsc);
	});
	document.getElementById("instidx").addEventListener("change", switchOsc);
	document.getElementById("testosc").addEventListener("click", testOsc);
	document.getElementById("end").addEventListener("change", changeEnd);
	document.getElementById("step").addEventListener("change", changeSig);
	
	for (var i = 0; i < 6; i++) {
		curOsc = i;
		defaultOsc(curOsc);
	}
	document.getElementById("instidx").value = "1";
	switchOsc();
	reloadOsc();
	
	scrx = 0;
	scry = 0;
}

function getOscType(id) {
	var sel = document.getElementById("osc" + id + "type");
	return sel.options[sel.selectedIndex].value;
}
function getNum(id, base, off) {
	if (off === undefined) off = 0;
	return parseFloat(document.getElementById(id).value) / base + off;
}
function setOscType(id, value) {
	var sel = document.getElementById("osc" + id + "type");
	sel.value = value;
}
function setNum(id, value) {
	document.getElementById(id).value = value;
}
function defaultOsc() {
	oscs[curOsc] = SimpleJSSynth(actx.destination, {
		osc1type: "sine",
		osc1vol : 3/(8),
		osc1tune: 1/(1/12)-12,
		osc2type: "square",
		osc2vol : 2/(8),
		osc2tune: 2/(1/12)-12,
		osc3type: "sine",
		osc3vol : 1/(8),
		osc3tune: 0/(1/12)-12,
		attack  : 0/(5),
		decay   : 2/(7/2),
		sustain : 2/(9),
		susdecay: 2/(14/5),
		cutoff  : 4/(1/8)-12
	});
	oscDatas[curOsc] = {
		osc1type: "sine",
		osc1vol : 3,
		osc1tune: 1,
		osc2type: "square",
		osc2vol : 2,
		osc2tune: 2,
		osc3type: "sine",
		osc3vol : 1,
		osc3tune: 0,
		attack  : 0,
		decay   : 2,
		sustain : 2,
		susdecay: 2,
		cutoff  : 4
	};
}
function switchOsc() {
	curOsc = parseInt(document.getElementById("instidx").value) - 1;
	setOscType(1, oscDatas[curOsc].osc1type);
	setNum("osc1vol", oscDatas[curOsc].osc1vol);
	setNum("osc1tune", oscDatas[curOsc].osc1tune);
	setOscType(2, oscDatas[curOsc].osc2type);
	setNum("osc2vol", oscDatas[curOsc].osc2vol);
	setNum("osc2tune", oscDatas[curOsc].osc2tune);
	setOscType(3, oscDatas[curOsc].osc3type);
	setNum("osc3vol", oscDatas[curOsc].osc3vol);
	setNum("osc3tune", oscDatas[curOsc].osc3tune);
	setNum("attack", oscDatas[curOsc].attack);
	setNum("decay", oscDatas[curOsc].decay);
	setNum("sustain", oscDatas[curOsc].sustain);
	setNum("susdecay", oscDatas[curOsc].susdecay);
	setNum("cutoff", oscDatas[curOsc].cutoff);
}
function reloadOsc() {
	oscs[curOsc] = SimpleJSSynth(actx.destination, {
		osc1type: getOscType(1),
		osc1vol : getNum("osc1vol", 8),
		osc1tune: getNum("osc1tune", 1/12, -12),
		osc2type: getOscType(2),
		osc2vol : getNum("osc2vol", 8),
		osc2tune: getNum("osc2tune", 1/12, -12),
		osc3type: getOscType(3),
		osc3vol : getNum("osc3vol", 8),
		osc3tune: getNum("osc3tune", 1/12, -12),
		attack  : getNum("attack", 5),
		decay   : getNum("decay", 7/2),
		sustain : getNum("sustain", 9),
		susdecay: getNum("susdecay", 14/5),
		cutoff  : getNum("cutoff", 1/8, -12)
	});
	console.log({
		osc1type: getOscType(1),
		osc1vol : getNum("osc1vol", 8),
		osc1tune: getNum("osc1tune", 1/12, -12),
		osc2type: getOscType(2),
		osc2vol : getNum("osc2vol", 8),
		osc2tune: getNum("osc2tune", 1/12, -12),
		osc3type: getOscType(3),
		osc3vol : getNum("osc3vol", 8),
		osc3tune: getNum("osc3tune", 1/12, -12),
		attack  : getNum("attack", 5),
		decay   : getNum("decay", 7/2),
		sustain : getNum("sustain", 9),
		susdecay: getNum("susdecay", 14/5),
		cutoff  : getNum("cutoff", 1/8, -12)
	});
	oscDatas[curOsc] = {
		osc1type: getOscType(1),
		osc1vol : getNum("osc1vol", 1),
		osc1tune: getNum("osc1tune", 1),
		osc2type: getOscType(2),
		osc2vol : getNum("osc2vol", 1),
		osc2tune: getNum("osc2tune", 1),
		osc3type: getOscType(3),
		osc3vol : getNum("osc3vol", 1),
		osc3tune: getNum("osc3tune", 1),
		attack  : getNum("attack", 1),
		decay   : getNum("decay", 1),
		sustain : getNum("sustain", 1),
		susdecay: getNum("susdecay", 1),
		cutoff  : getNum("cutoff", 1)
	};
}
function readOsc(oscIdx) {
	oscs[oscIdx] = SimpleJSSynth(actx.destination, {
		osc1type: oscDatas[oscIdx].osc1type,
		osc1vol : oscDatas[oscIdx].osc1vol/(8),
		osc1tune: oscDatas[oscIdx].osc1tune/(1/12)-12,
		osc2type: oscDatas[oscIdx].osc2type,
		osc2vol : oscDatas[oscIdx].osc2vol/(8),
		osc2tune: oscDatas[oscIdx].osc2tune/(1/12)-12,
		osc3type: oscDatas[oscIdx].osc3type,
		osc3vol : oscDatas[oscIdx].osc3vol/(8),
		osc3tune: oscDatas[oscIdx].osc3tune/(1/12)-12,
		attack  : oscDatas[oscIdx].attack/(5),
		decay   : oscDatas[oscIdx].decay/(7/2),
		sustain : oscDatas[oscIdx].sustain/(9),
		susdecay: oscDatas[oscIdx].susdecay/(14/5),
		cutoff  : oscDatas[oscIdx].cutoff/(1/8)-12
	});
}
function testOsc() {
	if (oscs[curOsc] != null) {
		oscs[curOsc].noteOn(440, 0.5);
	}
}
function playNote(oscIdx, idx) {
	idx = 100 - idx;
	var freq = 440*2**((idx-69)/12);
	oscs[oscIdx].noteOn(freq, 0.3);
}

function changeEnd() {
	end = parseInt(document.getElementById("end").value);
}
function changeSig() {
	step = parseInt(document.getElementById("step").value);
}

function createNote(length, fanIdx, instId, color, darkColor, pos) {
	return {
		length: length,
		fanIdx: fanIdx,
		instId: instId,
		color: color,
		darkColor: darkColor,
		pos: pos
	};
}

function backfast() {
	scrx = 0;
}
function back() {
	scrx -= step*4;
	scrx = Math.max(0, Math.min(scrx, 466));
}
function playpause() {
	if (playLoop == null) {
		var bpm = parseInt(document.getElementById("bpm").value);
		playLoop = setInterval(playsongpart, 60000/bpm/4);
		playsongpart(true);
	} else {
		clearInterval(playLoop);
		playLoop = null;
	}
}
function forward() {
	scrx += step*4;
	scrx = Math.max(0, Math.min(scrx, 466));
}
function forfast() {
	scrx = end * step*4 - step;
}

function playsongpart(s) {
	if (!s) scrx++;
	for (var i = 0; i < notes.length; i++) {
		var note = notes[i];
		if (note.pos[0] == scrx) {
			playNote(note.instId, notes[i].pos[1]);
		} else if (note.pos[0]+note.length == scrx) {
			oscs[note.instId].noteOff();
		}
	}
}

function copysel() {
	clipboard = [];
	clipboardPos = curSel.pos[0];
	for (var i = 0; i < notes.length; i++) {
		var note = notes[i];
		if (note.pos[0] >= curSel.pos[0] && note.pos[0] < curSel.pos[0]+curSel.length) {
			clipboard.push(note);
		}
	}
}

function pastesel() {
	var pastePos = curSel.pos[0];
	var off = pastePos - clipboardPos;
	for (var i = 0; i < clipboard.length; i++) {
		var note = clipboard[i];
		var pos = [note.pos[0] + off, note.pos[1]];
		notes.push(createNote(note.length, note.fanIdx, note.instId, note.color, note.darkColor, pos));
	}
}

function deletesel() {
	var newNotes = [];
	for (var i = notes.length - 1; i >= 0; i--) {
		var note = notes[i];
		var notePos = note.pos;
		if (!(notePos[0] >= curSel.pos[0] && notePos[0] < curSel.pos[0]+curSel.length && note.instId == curInst)) {
			newNotes.splice(0, 0, note);
		}
	}
	notes = newNotes;
}

function deleteselall() {
	var newNotes = [];
	for (var i = notes.length - 1; i >= 0; i--) {
		var note = notes[i];
		var notePos = note.pos;
		if (!(notePos[0] >= curSel.pos[0] && notePos[0] < curSel.pos[0]+curSel.length)) {
			newNotes.splice(0, 0, note);
		}
	}
	notes = newNotes;
}

function loadls() {
	var files = [];
	for (var i = 0; i < localStorage.length; i++) {
		var key = localStorage.key(i);
		if (key.startsWith("TEdatf-")) {
			files.push(key.substring(7));
		}
	}
	if (files.length > 0) {
		var filesStr = "Files on device:";
		for (var i = 0; i < files.length; i++) {
			filesStr += "\n" + files[i];
		}
		var inp = prompt(filesStr, "");
		if (files.includes(inp)) {
			var data = localStorage["TEdatf-" + inp];
			var oscDatasLen = parseInt(data.substr(0, 8));
			//yes why use json in json when you can just not
			end = parseInt(data.substr(8, 3));
			document.getElementById("bpm").value = parseInt(data.substr(8 + 3, 3));
			step = parseInt(data.substr(8 + 3 + 3, 3));
			document.getElementById("end").value = end;
			document.getElementById("step").value = step;
			var oscDatasJson = data.substr(8 + 3 + 3 + 3, oscDatasLen);
			var notesJson = data.substring(oscDatasLen + 8 + 3 + 3 + 3);
			oscDatas = JSON.parse(oscDatasJson);
			notes = JSON.parse(notesJson);
			for (var i = 0; i < 6; i++) {
				readOsc(i);
			}
			readOsc(0);
		} else {
			alert("File does not exist");
		}
	} else {
		alert("No files to select");
	}
}
function savels() {
	var inp = prompt("File name:", "");
	var oscDatasJson = JSON.stringify(oscDatas);
	var notesJson = JSON.stringify(notes);
	var oscDatasLen = oscDatasJson.length.toString().padStart(8, "0");
	var end = document.getElementById("end").value.padStart(3, "0");
	var bpm = document.getElementById("bpm").value.padStart(3, "0");
	var stp = document.getElementById("step").value.padStart(3, "0");
	var finalStr = oscDatasLen + end + bpm + stp + oscDatasJson + notesJson;
	localStorage.setItem("TEdatf-" + inp, finalStr);
}
function savejson() {
	var oscDatasJson = JSON.stringify(oscDatas);
	var notesJson = JSON.stringify(notes);
	var oscDatasLen = oscDatasJson.length.toString().padStart(8, "0");
	var end = document.getElementById("end").value.padStart(3, "0");
	var bpm = document.getElementById("bpm").value.padStart(3, "0");
	var stp = document.getElementById("step").value.padStart(3, "0");
	var finalStr = oscDatasLen + end + bpm + stp + oscDatasJson + notesJson;
	var inp = prompt("JSON (copy this): ", finalStr);
}
function encodeNote(isRest, xChange, yChange) {
	if (isRest) {
		return (0x100 | (xChange & 0xf)).toString(8).padStart(3, "0");
	} else {
		return ((yChange > 0 ? 0x100 : 0) | ((Math.abs(yChange) & 0xf) << 4) | (xChange & 0xf)).toString(8).padStart(3, "0");
	}
}
function expmusic() {
	var bpm = parseInt(document.getElementById("bpm").value);
	var finalStr = Math.round(60000/bpm/4).toString(8).padStart(3, "0");
	finalStr += step.toString(8);
	for (var it = 0; it < 6; it++) { //for each instrument
		var lastNoteY = 0;
		var noteCount = 0;
		var blockSize = step * 4;
		var blockIndices = []; //pattern indices
		var uniqueBlockStrs = []; //pattern data
		var allEmpty = true;
		for (var t = 0; t < end*blockSize; t += blockSize) { //for each block in song
			var lastNoteX = -1;
			var blockStr = "";
			for (var tt = 0; tt < blockSize; tt++) { //for each time in block
				for (var i = 0; i < notes.length; i++) {
					var note = notes[i];
					if (note.instId != it) continue;
					if (note.pos[0] != t+tt) continue;
					
					if (lastNoteX == -1) { //first note of block
						blockStr += note.pos[1].toString(8).padStart(3, "0"); //first pitch of block
						console.log("first note " + note.pos);
						if (note.pos[0] > 0) {
							//rest note
							var dist = note.pos[0] % blockSize;
							while (dist > 0) {
								var subDist = Math.min(16, dist);
								blockStr += encodeNote(true, subDist, 0);
								dist -= subDist;
							}
						}
						blockStr += encodeNote(false, note.length, 0);
						lastNoteX = note.pos[0] % blockSize + note.length;
						lastNoteY = note.pos[1];
					} else {
						console.log("not first note " + note.pos);
						var xDist = (note.pos[0] % blockSize) - lastNoteX - 1;
						var yDist = note.pos[1] - lastNoteY;
						if (xDist > 0) {
							//rest note
							while (xDist > 0) {
								var subDist = Math.min(16, xDist);
								blockStr += encodeNote(true, subDist, 0);
								xDist -= subDist;
							}
						}
						blockStr += encodeNote(false, note.length, yDist);
						lastNoteX = note.pos[0] % blockSize + note.length;
						lastNoteY = note.pos[1];
					}
				}
			}
			
			if (blockStr.length == 0) {
				blockStr += "069"; //default value when there are no notes (unused now)
			} else {
				allEmpty = false;
			}
			if (uniqueBlockStrs.includes(blockStr)) {
				blockIndices.push(uniqueBlockStrs.indexOf(blockStr));
			} else {
				uniqueBlockStrs.push(blockStr);
				blockIndices.push(uniqueBlockStrs.length - 1);
			}
		}
		
		if (allEmpty) {
			blockIndices = [];
			uniqueBlockStrs = [];
		}
		
		var instFinalStr = blockIndices.length.toString(8).padStart(2, "0");
		for (var i = 0; i < blockIndices.length; i++) {
			instFinalStr += blockIndices[i].toString(8).padStart(2, "0");
		}
		instFinalStr += uniqueBlockStrs.length.toString(8).padStart(2, "0");
		for (var i = 0; i < uniqueBlockStrs.length; i++) {
			instFinalStr += uniqueBlockStrs[i].length.toString(8).padStart(3, "0");
			instFinalStr += uniqueBlockStrs[i];
		}
		
		finalStr += instFinalStr;
	}
	var inp = prompt("CMPMUSIC (copy this): ", finalStr);
}
				
//if (lastNoteX == -1) { //first note of song
//	instFinalStr += note.pos[1]; //first pitch of song
//	if (note.pos[0] > 0) {
//		//rest note
//		var dist = note.pos[0];
//		while (dist > 0) {
//			var subDist = Math.min(16, dist);
//			instFinalStr += encodeNote(true, subDist, 0);
//			dist -= subDist;
//		}
//	}
//	instFinalStr += encodeNote(false, note.length, 0);
//	lastNoteX = note.pos[0];
//	lastNoteY = note.pos[1];
//} else {
//	var xDist = note.pos[0] - lastNoteX - 1;
//	var yDist = note.pos[1] - lastNoteY;
//	if (xDist > 0) {
//		//rest note
//		while (xDist > 0) {
//			var subDist = Math.min(16, xDist);
//			instFinalStr += encodeNote(true, subDist, 0);
//			xDist -= subDist;
//		}
//	}
//	instFinalStr += encodeNote(false, note.length, yDist);
//	lastNoteX = note.pos[0];
//	lastNoteY = note.pos[1];
//}


function drawVScrollbar(x, y, w, h, vis, max, scroll) {
	ctx.fillStyle = "#555555";
	ctx.fillRect(x, y, w, h);
	ctx.fillStyle = "#777777";
	var scrollHeight = Math.floor((vis/max)*h);
	var incHeight = h-scrollHeight;
	if (md && (x <= scx && scx < x+w) && (y <= scy && scy < y+h)) {
		scroll = Math.ceil(Math.max(0, Math.min(max-vis, ((cmy-y-scrollHeight/2)/(h-scrollHeight)) * (max-vis))));
	}
	ctx.fillRect(x, y + (scroll*incHeight/(max-vis)), w, scrollHeight);
	return scroll;
}

function drawHScrollbar(x, y, w, h, vis, max, scroll) {
	ctx.fillStyle = "#555555";
	ctx.fillRect(x, y, w, h);
	ctx.fillStyle = "#777777";
	var scrollWidth = Math.floor((vis/max)*w);
	var incWidth = w-scrollWidth;
	if (md && (x <= scx && scx < x+w) && (y <= scy && scy < y+h)) {
		scroll = Math.ceil(Math.max(0, Math.min(max-vis, ((cmx-x-scrollWidth/2)/(w-scrollWidth)) * (max-vis))));
	}
	ctx.fillRect(x + (scroll*incWidth/(max-vis)), y, scrollWidth, h);
	return scroll;
}

function drawNote(note) {
	ctx.fillStyle = note.color;
	ctx.fillRect(80+(note.pos[0]*25-scrx*25), 3+(note.fanIdx+(note.pos[1]-scry)*15), 25*note.length, 8);
	ctx.fillStyle = note.darkColor;
	ctx.fillRect(80+(note.pos[0]*25+2-scrx*25), 3+(note.fanIdx+(note.pos[1]-scry)*15), 3, 8);
}

function deleteNotes(xPos, yPos, once, onlyInstId) {
	var newNotes = [];
	var alwaysPush = false;
	var onlyInstIdSet = (onlyInstId !== undefined); //bad hack for now
	for (var i = notes.length - 1; i >= 0; i--) {
		var note = notes[i];
		var notePos = note.pos;
		if (!onlyInstIdSet) {
			onlyInstId = note.instId;
		}
		if (!(notePos[0] <= xPos && notePos[0]+note.length > xPos && notePos[1] == yPos && note.instId == onlyInstId) || alwaysPush) {
			newNotes.splice(0, 0, note);
		} else {
			if (once) alwaysPush = true;
		}
	}
	notes = newNotes;
	return newNotes;
}

function mousemove(e) {
	cmx = e.clientX - can2d.offsetLeft;
	cmy = e.clientY - can2d.offsetTop;
}
function mousedown(e) {
	cmx = e.clientX - can2d.offsetLeft;
	cmy = e.clientY - can2d.offsetTop;
	scx = cmx;
	scy = cmy;
	if (e.button == 0) {
		mju = false;
		mjd = true;
		md = true;
	} else if (e.button == 2) {
		rmju = false;
		rmjd = true;
		rmd = true;
	}
	mft = 0;
}
function mouseup(e) {
	if (e.button == 0) {
		md = false;
		mju = true;
		mjd = false;
	} else if (e.button == 2) {
		rmd = false;
		rmju = true;
		rmjd = false;
	}
}
function mousescroll(e) {
	if (e.shiftKey) {
		scrx += e.deltaY;
		scrx = Math.round(scrx);
		scrx = Math.max(0, Math.min(scrx, 466));
	} else {
		scry += e.deltaY;
		scry = Math.round(scry);
		scry = Math.max(0, Math.min(scry, 54));
	}
	e.preventDefault();
}
function contextmenu(e) {
	e.preventDefault();
}
function keydown(e) {
	kdwn[e.keyCode] = true;
}

function keyup(e) {
	kdwn[e.keyCode] = false;
}

function rendertone() {
	//draw piano roll
	var pianoOrder = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
	for (var j = 0; j < height/15+1; j++) {
		if (pianoOrder[(j+scry)%12] == 0) {
			ctx.fillStyle = "#5e5e5e";
			ctx.fillRect(80, j*15, 25*(width/25+1), 15);
		} else {
			ctx.fillStyle = "#4f4f4f";
			ctx.fillRect(80, j*15, 25*(width/25+1), 15);
		}
		for (var i = 0; i < width/25+1; i++) {
			var ii = i * 25;
			var jj = j * 15;
			ctx.fillStyle = "#404040";
			ctx.fillRect(ii+80, jj+7, 2, 2);
		}
	}
	for (var i = 0; i < width/25+1; i++) {
		var ii = i * (25*step);
		ctx.fillStyle = "#404040";
		ctx.fillRect(ii+80-(25*(scrx%step)), 0, 2, height);
	}
	for (var i = 0; i < width/100+1; i++) {
		var ii = i * (100*step);
		ctx.fillStyle = "#404040";
		ctx.fillRect(ii+80-(25*(scrx%(step*4))), 0, 4, height);
	}
	ctx.fillStyle = "#fc4040";
	ctx.fillRect(80+((end*100*step)-scrx*25), 0, 4, height);
	////
	//input notes
	if (curNote != null) {
		var xPos = Math.floor((cmx-80)/25) + scrx;
		var diff = xPos - curNoteStart + 1
		if (diff < 1) {
			diff = 1;
		}
		curNote.length = diff;
	}
		
	if (mjd) {
		if (cmx > 80 && cmx < width-15 && cmy < height-15) {
			var isSelNote = kdwn[17];
			
			var xPos = Math.floor((cmx-80)/25) + scrx;
			var yPos = Math.floor(cmy/15 + scry);

			//bad hack for now
			if (!isSelNote) {
				notes = deleteNotes(xPos, yPos, false, curInst);

				curNoteStart = xPos;
				curNote = createNote(1, curInst-3, curInst, instColors[curInst][0], instColors[curInst][1], [xPos, yPos]);
			
				can2d.style.cursor = "none";
				playNote(curInst, yPos);
			} else {
				curSel = null;
				curNoteStart = xPos;
				curNote = createNote(1, 0, curInst, "#ffffff", "#eeeeee", [xPos, yPos]);
				curNote.isSelNote = true;
			}
		}
	} else if (mju) {
		if (curNote != null) {
			if (!curNote.isSelNote) {
				for (var i = 0; i < curNote.length; i++) {
					notes = deleteNotes(curNote.pos[0]+scrx+i, curNote.pos[1], false, curInst);
				}
				notes.push(curNote);
				curNote = null;
				can2d.style.cursor = "default";
			} else {
				curSel = curNote;
				curNote = null;
			}
		}
	}
	if (rmjd) {
		var isSelNote = kdwn[17];
		if (!isSelNote) {
			if (cmx > 80 && cmx < width-15) {
				var xPos = Math.floor((cmx-80)/25) + scrx;
				var yPos = Math.floor(cmy/15 + scry);

				notes = deleteNotes(xPos, yPos, true);
			}
		} else {
			curSel = null;
		}
	}
	
	if (!md) {
		if (kdwn[48+1]) {
			curInst = 0;
		} else if (kdwn[48+2]) {
			curInst = 1;
		} else if (kdwn[48+3]) {
			curInst = 2;
		} else if (kdwn[48+4]) {
			curInst = 3;
		} else if (kdwn[48+5]) {
			curInst = 4;
		} else if (kdwn[48+6]) {
			curInst = 5;
		}
	}
	////
	//draw notes
	for (var i = 0; i < notes.length; i++) {
		drawNote(notes[i]);
	}
	if (curNote != null) {
		drawNote(curNote);
	}
	if (curSel != null) {
		drawNote(curSel);
	}
	////
	//draw piano
	for (var j = 0; j < height/15+1; j++) {
		if (pianoOrder[(j+scry)%12] == 0) {
			ctx.fillStyle = "#fcfcfc";
			ctx.fillRect(0, j*15, 80, 15);
		} else {
			ctx.fillStyle = "#636363";
			ctx.fillRect(0, j*15, 80, 15);
			ctx.fillStyle = "#313131";
			ctx.fillRect(0, j*15, 45, 15);
		}
	}
	for (var j = 0; j < height/15+1; j++) {
		if ((j+scry)%12 == 5 && (7-(j+scry)/12) >= 0) {
			ctx.font = "16px Verdana";
			ctx.fillStyle = "#111111";
			ctx.fillText(Math.floor(7-(j+scry)/12).toString(), 65, j*15-1);
		}
	}
	////
	scry = drawVScrollbar(945, 0, 15, 720, 15, 69, scry);
	scrx = drawHScrollbar(0, 705, 945, 15, 34, 500, scrx);
	mjd = false;
	mju = false;
	rmjd = false;
	rmju = false;
	requestAnimationFrame(rendertone);
}

setuptone();
requestAnimationFrame(rendertone);