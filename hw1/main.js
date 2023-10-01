document.addEventListener("DOMContentLoaded", function(event) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const gifs = document.querySelectorAll('.gif')
    let currentGifIndex = -1

    const waveform = document.getElementById('wave-form')
    const synthMode = document.getElementById('synth-mode')
    
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
            var osc1 = audioCtx.createOscillator();
            var osc2 = audioCtx.createOscillator();
            var osc3 = audioCtx.createOscillator();
            osc1.frequency.value = 1 * keyboardFrequencyMap[key];
            osc2.frequency.value = (2 * keyboardFrequencyMap[key]) + Math.random() * 15;
            osc3.frequency.value = (3 * keyboardFrequencyMap[key]) + Math.random() - 15;

            const globalGain = audioCtx.createGain();
            globalGain.gain.value = 0.0001;

            osc1.connect(globalGain)
            osc2.connect(globalGain);
            osc3.connect(globalGain);
            globalGain.connect(audioCtx.destination);

            globalGain.gain.setTargetAtTime(0.25, audioCtx.currentTime, 0.05);
            globalGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime + 0.2, 1);
            osc1.start();
            osc2.start();
            osc3.start();

            var lfo = audioCtx.createOscillator();
            lfo.frequency.value = 0.5;
            lfoGain = audioCtx.createGain();
            lfoGain.gain.value = 8;
            lfo.connect(lfoGain).connect(osc2.frequency);
            lfo.start();

            activeOscillators[key] = [osc1, osc2, osc3, lfo]
            activeGainNodes[key] = [globalGain, lfoGain]
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
            var carrier = audioCtx.createOscillator();
            var modulatorFreq = audioCtx.createOscillator();

            carrier.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)

            var modulationIndex = audioCtx.createGain();
            modulationIndex.gain.value = 100;
            modulatorFreq.frequency.value = 100;

            modulatorFreq.connect(modulationIndex);
            modulationIndex.connect(carrier.frequency)
            
            carrier.connect(audioCtx.destination);

            carrier.start();
            modulatorFreq.start();
            activeOscillators[key] = [carrier, modulatorFreq]
            activeGainNodes[key] = [modulationIndex]
        }
        
    }
})