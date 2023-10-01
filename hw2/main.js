var keysDown = [];


document.addEventListener("DOMContentLoaded", function(event) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const gifs = document.querySelectorAll('.gif')
    let currentGifIndex = -1

    const waveform = document.getElementById('wave-form')
    const synthMode = document.getElementById('synth-mode')

    lfoButton = document.getElementById("lfo")
    var indexSlider = document.getElementById("indexSlider")
    var partialSelect = document.getElementById("partials")
    var modSlider = document.getElementById("modfreqSlider")
    lfoSlider = document.getElementById("lfoSlider")
    indexSlider.disabled = true;
    modSlider.disabled = true;
    lfoSlider.disabled = true;


    

    
    
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

    activeOscillators = {}
    activeGainNodes = {}

    // function updateFMFreq(val) {
    //     activeOscillators
    //     fm_modulatorFreq.frequency.value = val;
    // };
    // function updateFMIndex(val) {
    //     fm_modulationIndex.gain.value = val;
    // };


    function keyDown(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            playNote(key);
            addGif()
            console.log('Added ' + currentGifIndex)
        }
    }

    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            // var current = activeGainNodes[key].gain.value

            activeGainNodes[key].forEach(function(element) {
                element.gain.cancelScheduledValues(audioCtx.currentTime);
                element.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05) // release
            })
            removeGif()
            setTimeout(function(){
                activeGainNodes[key].forEach(function(element) {
                    element.gain.setValueAtTime(0, audioCtx.currentTime)
                })
                
                activeOscillators[key].forEach(function(element) {
                    element.stop();
                })
                delete activeGainNodes[key]
                delete activeOscillators[key];
                console.log('Removed ' + currentGifIndex)
            },70)
            
        }
    }

    function addGif() {
        if (currentGifIndex < 3) {
            currentGifIndex += 1
            gifs[currentGifIndex].style.display = 'block';
        }
    }

    function removeGif() {
        if (currentGifIndex >= 0) {
            gifs[currentGifIndex].style.display = 'none';
            currentGifIndex -= 1
        }

    }

    function playNote(key) {
        //
        if (synthMode.value == 'default') {
            const osc = audioCtx.createOscillator();
            osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)

            const change = waveform.value 
            console.log(change)
            osc.type = change
            
            const gainNode = audioCtx.createGain();
            
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
            osc.connect(gainNode).connect(audioCtx.destination)
            osc.start();
            
            activeOscillators[key] = [osc]
            activeGainNodes[key] = [gainNode]

            num = Object.keys(activeGainNodes).length // num of active gain nodes 

            // for polyphony, lower the sustain gain for each active node 
            Object.keys(activeGainNodes).forEach((key) => {
                activeGainNodes[key].forEach(function(element) {
                    element.gain.setTargetAtTime(0.8 / num, audioCtx.currentTime, 0.2)
                })

            })

            gainNode.gain.setTargetAtTime(0.4 / num, audioCtx.currentTime+0.2, 0.1) 
        }

        else if (synthMode.value == 'additive') {
            const globalGain = audioCtx.createGain();
            globalGain.gain.value = 0.0001;

            globalGain.connect(audioCtx.destination);

            globalGain.gain.setTargetAtTime(0.25, audioCtx.currentTime, 0.05);
            globalGain.gain.setTargetAtTime(0.15, audioCtx.currentTime + 0.2, 1);
            
            oscillators = []
            var base = audioCtx.createOscillator();
            base.frequency.value = 1 * keyboardFrequencyMap[key]
            base.start();
            base.connect(globalGain)
            oscillators.push(base)

            for (var i = 0; i < partialSelect.value; i++) {
                var osc = audioCtx.createOscillator();
                osc.frequency.value = (i+1) * keyboardFrequencyMap[key] + (-1)**i * Math.random() * 15;
                osc.connect(globalGain);
                osc.start();
                oscillators.push(osc);
            }

            activeOscillators[key] = oscillators
            activeGainNodes[key] = [globalGain]

            if (lfo == true) {
                var lfo = audioCtx.createOscillator();
                lfo.frequency.value = 0.5;
                lfoGain = audioCtx.createGain();
                lfoGain.gain.value = 8;
                lfo.connect(lfoGain).connect(osc2.frequency);
                lfo.start();
                activeGainNodes[key].push(lfoGain)
                activeOscillators[key].push(lfo)
            }

            Object.keys(activeGainNodes).forEach((key) => {
                for (var i = 0; i < activeGainNodes[key].length; i++) {
                    activeGainNodes[key][i].gain.setTargetAtTime(0.7 / Object.keys(activeGainNodes).length, audioCtx.currentTime, 0.2)
                }
            })

            
        }

        else if (synthMode.value == 'am') {
            var carrier = audioCtx.createOscillator();
            var modulatorFreq = audioCtx.createOscillator();
            modulatorFreq.frequency.value = 100;
            carrier.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)

            const modulated = audioCtx.createGain();
            const depth = audioCtx.createGain();
            depth.gain.value = 0.5 //scale modulator output to [-0.5, 0.5]
            modulated.gain.value = 1.0 - depth.gain.value; //a fixed value of 0.5

            modulatorFreq.connect(depth).connect(modulated.gain); //.connect is additive, so with [-0.5,0.5] and 0.5, the modulated signal now has output gain at [0,1]
            carrier.connect(modulated)
            modulated.connect(audioCtx.destination);
            
            carrier.start();
            modulatorFreq.start();
            activeOscillators[key] = [carrier, modulatorFreq]
            activeGainNodes[key] = [modulated, depth]
        }

        else if (synthMode.value == 'fm') {
            var fm_carrier = audioCtx.createOscillator();
            var fm_modulatorFreq = audioCtx.createOscillator();

            fm_carrier.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)

            var fm_modulationIndex = audioCtx.createGain();
            fm_modulationIndex.gain.value = 100;
            fm_modulatorFreq.frequency.value = 100;

            fm_modulatorFreq.connect(fm_modulationIndex);
            fm_modulationIndex.connect(fm_carrier.frequency)
            
            fm_carrier.connect(audioCtx.destination);

            var fm_lfo = audioCtx.createOscillator();
            fm_lfo.frequency.value = 2;
            fm_lfoGain = audioCtx.createGain();
            fm_lfoGain.gain.value = 300;
            fm_lfo.connect(fm_lfoGain).connect(fm_modulatorFreq.frequency);
            fm_lfo.start();
            

            fm_carrier.start();
            fm_modulatorFreq.start();
            activeOscillators[key] = [fm_carrier, fm_modulatorFreq, fm_lfo]
            activeGainNodes[key] = [fm_modulationIndex, fm_lfoGain]
        }
        
    }
   
})

function changePartials(){
    partialNum = document.getElementById("partials").value
}

function lfoToggle(){
    slider = document.getElementById("lfoSlider")
    if (lfo === true){
        lfo = false;
        lfoButton.style.backgroundColor = "#FFFFFF";
        slider.disabled = true;
    }
    else{
        lfo = true;
        lfoButton.style.backgroundColor = "#b4e0b4"
        slider.disabled = false;
    }
}


function updateLFO(val){
    lfoFreq = val;
    for (k in keysDown){
        activeLFO[keysDown[k]].frequency.value = val;
    }
}