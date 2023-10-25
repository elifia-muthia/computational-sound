const playBrook = document.getElementById('playBrook');
const farnell = document.getElementById('playFarnell');
var audioCtx;
var audioCtx_farnell;

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

farnell.addEventListener('click', function () {
    if (!audioCtx_farnell) {
        playFarnell();
        return;
    }
    else if (audioCtx_farnell.state === 'suspended') {
        audioCtx_farnell.resume();
    }
    else if (audioCtx_farnell.state === 'running') {
        audioCtx_farnell.suspend();
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


function playFarnell() {
    console.log("Part 2");

    audioCtx_farnell = new AudioContext();

    // white noise
    var bufferSize = 10 * audioCtx_farnell.sampleRate,
        noiseBuffer = audioCtx_farnell.createBuffer(1, bufferSize, audioCtx_farnell.sampleRate),
        output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.5;
    }
    whiteNoise = audioCtx_farnell.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.start(0);

    /* HISSING */
    const gain_oscillator = audioCtx_farnell.createOscillator()
    gain_oscillator.type = "triangle"
    gain_oscillator.frequency.value = 0.5

    const envelopeOscillator = audioCtx_farnell.createOscillator();
    envelopeOscillator.type = "sine"; // You can use a sine wave for smooth modulation
    envelopeOscillator.frequency.value = 0.2;

    gain_oscillator.start()
    envelopeOscillator.start()

    const gainNode = audioCtx_farnell.createGain();

    envelopeOscillator.connect(gainNode.gain);
    gain_oscillator.connect(gainNode)

    const hiss_gain = audioCtx_farnell.createGain();
    const total_hiss_gain = audioCtx_farnell.createGain();
    total_hiss_gain.gain.value = 0.005

    const lpf = audioCtx_farnell.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 1;

    const hpf = audioCtx_farnell.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 1000;

    whiteNoise.connect(hpf).connect(hiss_gain)
    whiteNoise.connect(lpf).connect(hiss_gain)
    gainNode.connect(hiss_gain.gain)
    hiss_gain.connect(total_hiss_gain).connect(audioCtx_farnell.destination)


    /* CRACKLING 1 */



    

    /* FLAMES */
    const flame_bpf = audioCtx_farnell.createBiquadFilter()
    flame_bpf.type = "bandpass"
    flame_bpf.frequency.value = 30
    flame_bpf.Q.value = 5

    const flame_hpf = audioCtx_farnell.createBiquadFilter()
    flame_hpf.type = 'highpass';
    flame_hpf.frequency.value = 25

    const flame_clip = audioCtx_farnell.createWaveShaper();
    var distortion = new Float32Array(2);
    distortion[0] = -0.9;
    distortion[1] = 0.9;
    flame_clip.curve = distortion;

    const flame_hpf2 = audioCtx_farnell.createBiquadFilter()
    flame_hpf2.type = 'highpass';
    flame_hpf2.frequency.value = 25

    const flames_gain = audioCtx_farnell.createGain();
    flames_gain.gain.value = 10;

    whiteNoise.connect(flame_bpf)
                .connect(flame_hpf)
                .connect(flame_clip)
                .connect(flame_hpf2)
                .connect(flames_gain)
                .connect(audioCtx_farnell.destination)
}


