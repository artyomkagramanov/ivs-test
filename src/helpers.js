async function handlePermissions() {
    let permissions = {
        audio: false,
        video: false,
    };
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        for (const track of stream.getTracks()) {
            track.stop();
        }
        permissions = { video: true, audio: true };
    } catch (err) {
        console.dir(err)
        permissions = { video: false, audio: false, error: err.message, errorType: err.name };
    }
    return permissions;
}

async function getDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');
    const audioDevices = devices.filter((d) => d.kind === 'audioinput');
    return {
        videoDevices,
        audioDevices
    }
}

export {
    handlePermissions,
    getDevices,
};