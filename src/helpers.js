async function requestPermissionAndGetDevices() {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        const audioDevices = devices.filter((d) => d.kind === 'audioinput');
        return {
            videoDevices,
            audioDevices
        }
    } catch (err) {
        throw err;
    }
}


export {
    requestPermissionAndGetDevices,
};