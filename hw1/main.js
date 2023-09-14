var audioCtx;
const playButton = document.querySelector('button');

playButton.addEventListener('click', function () {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)
        let osc = audioCtx.createOscillator();
        osc.connect(audioCtx.destination)
        osc.start()
    }
})