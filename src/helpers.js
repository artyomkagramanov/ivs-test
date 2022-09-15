async function requestPermissionAndGetDevices() {
    let videoDevices = [];
    let audioDevices = [];
    let videoError = null;
    let audioError = null;
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        videoDevices = devices.filter((d) => d.kind === 'videoinput');
    } catch (err) {
        videoError = err;
    }
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        audioDevices = devices.filter((d) => d.kind === 'audioinput');
    } catch (err) {
        audioError = err;
    }
    return {
        video: {
            videoDevices,
            videoError,
        },
        audio: {
            audioDevices,
            audioError,
        }
    }
}


export {
    requestPermissionAndGetDevices,
};