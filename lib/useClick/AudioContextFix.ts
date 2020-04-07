let fixed: boolean = false;

export const createAudioContext = (): AudioContext => {
    if (!fixed) {
        fixAudioContext();
    }
    return new window.AudioContext();
};

export const fixAudioContext = () => {
    // @ts-ignore
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    if (window.AudioContext) {
        // @ts-ignore
        window.audioContext = new window.AudioContext();
    }
    const fixAudioContext = () => {
        // @ts-ignore
        if (window.audioContext) {
            // Create empty buffer
            // @ts-ignore
            let buffer = window.audioContext.createBuffer(1, 1, 22050);
            // @ts-ignore
            let source = window.audioContext.createBufferSource();
            source.buffer = buffer;
            // Connect to output (speakers)
            // @ts-ignore
            source.connect(window.audioContext.destination);
            // Play sound
            if (source.start) {
                source.start(0);
            } else if (source.play) {
                source.play(0);
            } else if (source.noteOn) {
                source.noteOn(0);
            }
        }
        // Remove events
        document.removeEventListener('touchstart', fixAudioContext);
        document.removeEventListener('touchend', fixAudioContext);
    };
    // iOS 6-8
    document.addEventListener('touchstart', fixAudioContext);
    // iOS 9
    document.addEventListener('touchend', fixAudioContext);
};
