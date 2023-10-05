var modFreqVal = 100;
var lfoFreqVal = 0;
var modIndexVal = 100;

document.addEventListener("DOMContentLoaded", function(event) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    var synthMode = document.getElementById("select_synth").synth
    var partialsContainer = document.getElementById("partialsContainer");
    var partialSelect = document.getElementById("partials")
    var modfreqContainer = document.getElementById("modfreqContainer");
    var indexContainer = document.getElementById("indexContainer");
    var lfoContainer = document.getElementById("lfoContainer");

    const waveform = document.getElementById('wave-form');

    // Hide all containers first
    partialsContainer.style.display = "block";
    modfreqContainer.style.display = "none";
    indexContainer.style.display = "none";
    lfoContainer.style.display = "block";

    for (var i = 0; i < synthMode.length; i++){
        synthMode[i].onclick= function(){
            synthType = this.value;
            if (synthType === 'fm') {
                partialsContainer.style.display = "none";
                modfreqContainer.style.display = "block";
                indexContainer.style.display = "block";
                lfoContainer.style.display = "block";
            }
            else if (synthType === 'additive'){
                partialsContainer.style.display = "block";
                modfreqContainer.style.display = "none";
                indexContainer.style.display = "none";
                lfoContainer.style.display = "block";

            }

            else{
                partialsContainer.style.display = "none";
                modfreqContainer.style.display = "block";
                indexContainer.style.display = "none";
                lfoContainer.style.display = "block";
            }
        }
    }

    

    const keyboardFrequencyMap = {
        '90': 261.625565300598634,  //Z - C
        '83': 277.182630976872096, //S - C#
        '88': 293.664767917407560,  //X - D
        '68': 311.126983722080910, //D - D#
        '67': 329.627556912869929,  //C - E
        '86': 349.228231433003884,  //V - F
        '71': 369.994422711634398, //G - F#
        '66': 391.995435981749294,  //B - G
        '72': 415.304697579945138, //H - G#
        '78': 440.000000000000000,  //N - A
        '74': 466.163761518089916, //J - A#
        '77': 493.883301256124111,  //M - B
        '81': 523.251130601197269,  //Q - C
        '50': 554.365261953744192, //2 - C#
        '87': 587.329535834815120,  //W - D
        '51': 622.253967444161821, //3 - D#
        '69': 659.255113825739859,  //E - E
        '82': 698.456462866007768,  //R - F
        '53': 739.988845423268797, //5 - F#
        '84': 783.990871963498588,  //T - G
        '54': 830.609395159890277, //6 - G#
        '89': 880.000000000000000,  //Y - A
        '55': 932.327523036179832, //7 - A#
        '85': 987.766602512248223,  //U - B
    }


    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    var compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, audioCtx.currentTime);

    activeOscillators = {}
    activeGainNodes = {}



    function keyDown(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            playNote(key);
        }
    }

    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            // var current = activeGainNodes[key].gain.value

            activeGainNodes[key].forEach(function(element) {
                element.gain.cancelScheduledValues(audioCtx.currentTime);
                element.gain.setValueAtTime(element.gain.value, audioCtx.currentTime); // Set the current gain value
                element.gain.linearRampToValueAtTime(0.00001, audioCtx.currentTime + 0.05); // Release with a smoother curve
            });
            
            setTimeout(function(){
                activeGainNodes[key].forEach(function(element) {
                    element.gain.setValueAtTime(0, audioCtx.currentTime);
                });
            
                activeOscillators[key].forEach(function(element) {
                    element.stop();
                });
                
                delete activeGainNodes[key];
                delete activeOscillators[key];
            }, 70);
        }
    }

    function playNote(key) {
        if (synthMode.value == 'additive') {
            const globalGain = audioCtx.createGain();
            globalGain.gain.value = 0.0001;

            globalGain.connect(audioCtx.destination);

            globalGain.gain.setTargetAtTime(0.25, audioCtx.currentTime, 0.05);
            
            oscillators = []
            var base = audioCtx.createOscillator();
            base.frequency.value = 1 * keyboardFrequencyMap[key]
            base.start();
            base.connect(globalGain)
            base.type = waveform.value
            console.log(waveform.value)
            oscillators.push(base)

            for (var i = 0; i < partialSelect.value; i++) {
                var osc = audioCtx.createOscillator();
                osc.frequency.value = (i+2) * keyboardFrequencyMap[key] + (-1)**i * Math.random() * 15;
                osc.connect(globalGain);
                osc.type = waveform.value
                osc.start();
                oscillators.push(osc);
            }

            activeOscillators[key] = oscillators
            activeGainNodes[key] = [globalGain]

            var lfo = audioCtx.createOscillator();
            lfo.frequency.setValueAtTime(lfoFreqVal, audioCtx.currentTime)
            lfo.connect(globalGain).connect(base.frequency);
            lfo.start();
            activeOscillators[key].push(lfo)

            Object.keys(activeGainNodes).forEach((key) => {
                for (var i = 0; i < activeGainNodes[key].length; i++) {
                    activeGainNodes[key][i].gain.setTargetAtTime(0.7 / (Object.keys(activeGainNodes).length + (oscillators.length * Object.keys(activeGainNodes).length)), audioCtx.currentTime, 0.2)
                }
            })

            
        }

        else if (synthMode.value == 'am') {
            var carrier = audioCtx.createOscillator();
            var modulatorFreq = audioCtx.createOscillator();
            modulatorFreq.frequency.setValueAtTime(modFreqVal, audioCtx.currentTime);
            carrier.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)

            carrier.type = waveform.value;
            modulatorFreq.type = waveform.value;

            console.log(modulatorFreq)

            const modulated = audioCtx.createGain();
            const depth = audioCtx.createGain();
            depth.gain.value = 0.5 //scale modulator output to [-0.5, 0.5]
            modulated.gain.value = 1.0 - depth.gain.value; //a fixed value of 0.5

            modulatorFreq.connect(depth).connect(modulated.gain); //.connect is additive, so with [-0.5,0.5] and 0.5, the modulated signal now has output gain at [0,1]
            carrier.connect(modulated)
            modulated.connect(compressor).connect(audioCtx.destination);
            
            modulated.gain.setValueAtTime(0, audioCtx.currentTime)
            //depth.gain.setValueAtTime(0, audioCtx.currentTime)

            carrier.start()
            modulatorFreq.start()
            activeOscillators[key] = [carrier, modulatorFreq]
            activeGainNodes[key] = [modulated, depth]

            var lfo = audioCtx.createOscillator();
            lfo.frequency.setValueAtTime(lfoFreqVal, audioCtx.currentTime)
            lfo.connect(modulated).connect(modulatorFreq.frequency);
            lfo.type = waveform.value;
            lfo.start();
            activeOscillators[key].push(lfo)

            Object.keys(activeGainNodes).forEach((key) => {
                for (var i = 0; i < activeGainNodes[key].length; i++) {
                    activeGainNodes[key][i].gain.setTargetAtTime(0.9 / (Object.keys(activeGainNodes).length + (2 * Object.keys(activeGainNodes).length)), audioCtx.currentTime, 0.05)
                }
            })
        }

        else if (synthMode.value == 'fm') {
            var fm_carrier = audioCtx.createOscillator();
            var fm_modulatorFreq = audioCtx.createOscillator();
            fm_carrier.type = waveform.value;
            fm_modulatorFreq.type = waveform.value;

            fm_carrier.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)

            var fm_modulationIndex = audioCtx.createGain();
            var gainNode = audioCtx.createGain();

            gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime)

            fm_modulationIndex.gain.value = modIndexVal;
            fm_modulatorFreq.frequency.value = modFreqVal;

            fm_modulatorFreq.connect(fm_modulationIndex);
            fm_modulationIndex.connect(fm_carrier.frequency)
            
            fm_carrier.connect(gainNode).connect(compressor).connect(audioCtx.destination);

            fm_carrier.start();
            fm_modulatorFreq.start();
            
            var fm_lfo = audioCtx.createOscillator();
            fm_lfo.frequency.value = lfoFreqVal;
            var fm_lfoGain = audioCtx.createGain();
            fm_lfoGain.gain.value = 8;
            fm_lfo.connect(fm_lfoGain).connect(fm_modulatorFreq.frequency);
            fm_lfo.type = waveform.value;
            fm_lfo.start();

            activeOscillators[key] = [fm_carrier, fm_modulatorFreq, fm_lfo]
            activeGainNodes[key] = [fm_modulationIndex, gainNode, fm_lfoGain]
        }
        
    }
   
})

function changePartials(){
    partialNum = document.getElementById("partials").value
}

function updateLFO(val){
    lfoFreqVal = val;
}

function updateModFreq(val) {
    modFreqVal = val
};

function updateIndex(val) {
    modIndexVal = val
};

var lfoValueInput = document.getElementById("lfoValue");


lfoValueInput.addEventListener("input", function () {
    var currentValue = parseFloat(lfoValueInput.value);
    var minValue = parseFloat(lfoValueInput.min);
    var maxValue = parseFloat(lfoValueInput.max);

    if (currentValue < minValue) {
        lfoValueInput.value = minValue;
    } else if (currentValue > maxValue) {
        lfoValueInput.value = maxValue;
    }

    // Update the global variable or call the appropriate function here
    updateLFO(lfoValueInput.value);
});

lfoValueInput.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp") {
        incrementValue("lfoValue");
    } else if (e.key === "ArrowDown") {
        decrementValue("lfoValue");
    }
});


var modfreqValueInput = document.getElementById("modfreqValue");

modfreqValueInput.addEventListener("input", function () {
    var currentValue = parseFloat(modfreqValueInput.value);
    var minValue = parseFloat(modfreqValueInput.min);
    var maxValue = parseFloat(modfreqValueInput.max);

    if (currentValue < minValue) {
        modfreqValueInput.value = minValue;
    } else if (currentValue > maxValue) {
        modfreqValueInput.value = maxValue;
    }

    // Update the global variable or call the appropriate function here
    updateModFreq(modfreqValueInput.value);
});

modfreqValueInput.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp") {
        incrementValue("modfreqValue");
    } else if (e.key === "ArrowDown") {
        decrementValue("modfreqValue");
    }
});


var indexValueInput = document.getElementById("indexValue");

indexValueInput.addEventListener("input", function () {
    var currentValue = parseFloat(indexValueInput.value);
    var minValue = parseFloat(indexValueInput.min);
    var maxValue = parseFloat(indexValueInput.max);

    if (currentValue < minValue) {
        indexValueInput.value = minValue;
    } else if (currentValue > maxValue) {
        indexValueInput.value = maxValue;
    }

    // Update the global variable or call the appropriate function here
    updateIndex(indexValueInput.value);
});

indexValueInput.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp") {
        incrementValue("indexValue");
    } else if (e.key === "ArrowDown") {
        decrementValue("indexValue");
    }
});

function incrementValue(inputId) {
    var inputElement = document.getElementById(inputId);
    var currentValue = parseFloat(inputElement.value);
    var maxValue = parseFloat(inputElement.getAttribute("max"));
    if (currentValue < maxValue) {
        
        if (inputId === 'modfreqValue') {
            inputElement.value = (currentValue + 10).toString();
            updateModFreq(inputElement.value);
        } else if (inputId === 'indexValue') {
            inputElement.value = (currentValue + 10).toString();
            updateIndex(inputElement.value);
        } else if (inputId === 'lfoValue') {
            inputElement.value = (currentValue + 1).toString();
            updateLFO(inputElement.value);
        }
    }
}

function decrementValue(inputId) {
    var inputElement = document.getElementById(inputId);
    var currentValue = parseFloat(inputElement.value);
    var minValue = parseFloat(inputElement.getAttribute("min"));
    if (currentValue > minValue) {
        

        if (inputId === 'modfreqValue') {
            inputElement.value = (currentValue - 10).toString();
            updateModFreq(inputElement.value);
        } else if (inputId === 'indexValue') {
            inputElement.value = (currentValue - 10).toString();
            updateIndex(inputElement.value);
        } else if (inputId === 'lfoValue') {
            inputElement.value = (currentValue - 1).toString();
            updateLFO(inputElement.value);
        }
    }
}