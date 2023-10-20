const playBrook = document.getElementById('playBrook');
var audioCtx;

playBrook.addEventListener('click', function () {
    if (!audioCtx) {
        playBabblingBrook();
        return;
    }
    else if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    else if (audioCtx.state === 'running') {
        audioCtx.suspend();
    }


}, false);

function playBabblingBrook() {
    console.log("Babbling Brook");

    audioCtx = new AudioContext()

    var bufferSize = 10 * audioCtx.sampleRate;
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    output = noiseBuffer.getChannelData(0);

    var lastOut = 0;
    for (var i = 0; i < bufferSize; i++) {
        var brown = Math.random() * 2 - 1;
    
        output[i] = (lastOut + (0.02 * brown)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
    }

    const totalGain = audioCtx.createGain();
    totalGain.gain.value = 0.2;

    const lpf1 = audioCtx.createBiquadFilter();
    lpf1.type = 'lowpass';
    lpf1.frequency.value = 400;

    const lpf2 = audioCtx.createBiquadFilter();
    lpf2.type = 'lowpass';
    lpf2.frequency.value = 14;
    
    const lpf2_gain = audioCtx.createGain();
    lpf2_gain.gain.value = 1200;
    
    const freq_offset = audioCtx.createConstantSource();
    freq_offset.offset.value = 150
    freq_offset.start()

    const rhpf = audioCtx.createBiquadFilter();
    rhpf.type = 'highpass';
    rhpf.Q.value = 1/0.03;
    rhpf.gain.value = 0.1;

    brownNoise = audioCtx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;
    brownNoise.start(0);
    
    brownNoise.connect(lpf1).connect(rhpf);
    brownNoise.connect(lpf2).connect(lpf2_gain).connect(rhpf.frequency);
    freq_offset.connect(rhpf.frequency);
    rhpf.connect(totalGain).connect(audioCtx.destination)
}


function playWave() {
    console.log("Wave");

    audioCtx = new AudioContext()

    var bufferSize = 10 * audioCtx.sampleRate;
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    output = noiseBuffer.getChannelData(0);

    var lastOut = 0;
    for (var i = 0; i < bufferSize; i++) {
        var brown = Math.random() * 2 - 1;
    
        output[i] = (lastOut + (0.02 * brown)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
    }

    const lowPassFilter = audioCtx.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.value = 2000;
    lowPassFilter.Q.value = 1;

    const highPassFilter = audioCtx.createBiquadFilter();
    highPassFilter.type = 'highpass';
    highPassFilter.frequency.value = 200;

    const modulationOscillator = audioCtx.createOscillator();
    modulationOscillator.type = 'sine';
    modulationOscillator.frequency.value = 0.1; 

    const amplitudeModulator = audioCtx.createGain();
    amplitudeModulator.gain.value = 0.2;

    const totalGain = audioCtx.createGain();
    totalGain.gain.value = 0.1;

    brownNoise = audioCtx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;
    brownNoise.start(0);
    
    
    brownNoise.connect(lowPassFilter);
    lowPassFilter.connect(highPassFilter);
    highPassFilter.connect(amplitudeModulator);
    amplitudeModulator.connect(totalGain);

    modulationOscillator.connect(amplitudeModulator.gain);
    modulationOscillator.start();

    totalGain.connect(audioCtx.destination);
}