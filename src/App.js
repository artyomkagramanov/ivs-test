import './App.css';
import { useRef, useEffect, useState } from 'react';
import {
  requestPermissionAndGetDevices,
} from './helpers'
import IVSBroadcastClient, {
  BASIC_LANDSCAPE
} from 'amazon-ivs-web-broadcast';

const streamConfig = BASIC_LANDSCAPE;
const streamKey = process.env.REACT_APP_STREAM_KEY;
const ingestServer = process.env.REACT_APP_INGEST_SERVER;


function App() {
  const client = useRef();
  const mainPreview = useRef();
  const secondaryPreview = useRef();
  const [videoDevices, setVideoDevices] = useState([]);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [activeSettingsTab, setActiveSettingsTab] = useState('stream');
  const [globalError, setGlobalError] = useState('');

  const [videoError, setVideoError] = useState(null);
  const [audioError, setAudioError] = useState(null);

  useEffect(() => {
    console.log(ingestServer)
    client.current = IVSBroadcastClient.create({
      // Enter the desired stream configuration
      streamConfig: IVSBroadcastClient.BASIC_LANDSCAPE,
      // Enter the ingest endpoint from the AWS console or CreateChannel API
      ingestEndpoint: ingestServer,
    });
    window.client = client.current;
  }, [])

  const handleStreamStart = async (e) => {
    try {
      const devices = await requestPermissionAndGetDevices();
      const { video, audio } = devices;
      const { videoDevices, videoError: videoPermissionError } = video;
      const { audioDevices, audioError: audioPermissionError } = audio;
      setVideoDevices(videoDevices);
      setAudioDevices(audioDevices);
      setVideoError(videoPermissionError);
      setAudioError(audioPermissionError);

      if (videoPermissionError === null) {
        let videoDeviceId;
        if (selectedVideoDeviceId) {
          videoDeviceId = selectedVideoDeviceId;
        } else {
          let savedDeviceId = getDevice('video');
          if (savedDeviceId) {
            const exists = videoDevices.find(device => device.deviceId === savedDeviceId);
            console.log(exists)
            if (!exists) {
              savedDeviceId = null;
              removeDevice('video');
            }
          }
          videoDeviceId = savedDeviceId || videoDevices[0].deviceId;
          setSelectedVideoDeviceId(videoDeviceId);
        }
        window.cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: videoDeviceId,
            width: {
              ideal: streamConfig.maxResolution.width,
              max: streamConfig.maxResolution.width,
            },
            height: {
              ideal: streamConfig.maxResolution.height,
              max: streamConfig.maxResolution.height,
            },
          },
        });
        try {
          client.current.removeVideoInputDevice('camera1');
        } catch (e) { }
        client.current.addVideoInputDevice(window.cameraStream, 'camera1', { index: 0 }); // only 'index' is required for the position parameter
      }

      if (audioPermissionError === null) {
        let audioDeviceId;
        if (selectedAudioDeviceId) {
          audioDeviceId = selectedAudioDeviceId;
        } else {
          let savedDeviceId = getDevice('audio');
          if (savedDeviceId) {
            const exists = audioDevices.find(device => device.deviceId === savedDeviceId);
            if (!exists) {
              savedDeviceId = null;
              removeDevice('audio');
            }
          }
          audioDeviceId = savedDeviceId || audioDevices[0].deviceId;
          setSelectedAudioDeviceId(audioDeviceId);
        }

        window.microphoneStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: audioDeviceId },
        });
        try {
          client.current.removeAudioInputDevice('mic1');
        } catch (e) { }
        client.current.addAudioInputDevice(window.microphoneStream, 'mic1');
      }


      if (audioPermissionError && videoPermissionError) {
        const errorMsg = `Video: ${getPermissionErrorMessage(videoPermissionError)}, Audio: ${getPermissionErrorMessage(audioPermissionError)}`
        setGlobalError(errorMsg)
        return;
      }

      client.current.detachPreview(secondaryPreview.current);
      client.current.attachPreview(mainPreview.current);
      await client.current.startBroadcast(streamKey);
      setIsStreamActive(true);

    } catch (error) {
      console.dir(error)
    }

  }

  const handleStreamEnd = async () => {
    await client.current.stopBroadcast(streamKey);
    client.current.detachPreview(mainPreview.current);
    setIsStreamActive(false)
    // window.cameraStream = null
  }

  const initDevices = async () => {
    try {
      const devices = await requestPermissionAndGetDevices();
      const { video, audio } = devices;
      const { videoDevices, videoError: videoPermissionError } = video;
      const { audioDevices, audioError: audioPermissionError } = audio;
      setVideoDevices(videoDevices);
      setAudioDevices(audioDevices);
      setVideoError(videoError);
      setAudioError(audioError);
      if (videoPermissionError === null) {
        let videoDeviceId;
        if (selectedVideoDeviceId) {
          videoDeviceId = selectedVideoDeviceId;
        } else {
          let savedDeviceId = getDevice('video');
          if (savedDeviceId) {
            const exists = videoDevices.find(device => device.deviceId === savedDeviceId);
            console.log(exists)
            if (!exists) {
              savedDeviceId = null;
              removeDevice('video');
            }
          }
          videoDeviceId = savedDeviceId || videoDevices[0].deviceId;
          setSelectedVideoDeviceId(videoDeviceId);
        }
        window.cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: videoDeviceId,
            width: {
              ideal: streamConfig.maxResolution.width,
              max: streamConfig.maxResolution.width,
            },
            height: {
              ideal: streamConfig.maxResolution.height,
              max: streamConfig.maxResolution.height,
            },
          },
        });
        secondaryPreview.current.srcObject = window.cameraStream;
        secondaryPreview.current.onloadedmetadata = async function (e) {
          await secondaryPreview.current.play();
        };
      }

      if (audioPermissionError === null) {
        let audioDeviceId;
        if (selectedAudioDeviceId) {
          audioDeviceId = selectedAudioDeviceId;
        } else {
          let savedDeviceId = getDevice('audio');
          if (savedDeviceId) {
            const exists = audioDevices.find(device => device.deviceId === savedDeviceId);
            if (!exists) {
              savedDeviceId = null;
              removeDevice('audio');
            }
          }
          audioDeviceId = savedDeviceId || audioDevices[0].deviceId;
          setSelectedAudioDeviceId(audioDeviceId);
        }
      }

    } catch (error) {
      console.dir(error)
    }
  }

  const getPermissionErrorMessage = (error) => {
    const { name } = error;
    let message;
    switch (name) {
      case 'NotAllowedError': {
        message = 'Permission denied by user or user agent';
        break;
      }
      case 'OverconstrainedError':
      case 'NotFoundError': {
        message = 'There is no available devices';
        break;
      }
      default: {
        message = 'Unknown error';
      }
    }
    return message;
  }

  const saveDevice = (type, deviceId) => {
    localStorage.setItem(type, deviceId)
  }

  const getDevice = (type) => {
    return localStorage.getItem(type)
  }

  const removeDevice = (type) => {
    localStorage.removeItem(type)
  }

  const handleDeviceChange = async (type, deviceId) => {
    saveDevice(type, deviceId);
    try {
      if (type === 'video') {
        setSelectedVideoDeviceId(deviceId);

        if (window.cameraStream) {
          for (const track of window.cameraStream.getTracks()) {
            track.stop();
          }
        }
        window.cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId,
            width: {
              ideal: streamConfig.maxResolution.width,
              max: streamConfig.maxResolution.width,
            },
            height: {
              ideal: streamConfig.maxResolution.height,
              max: streamConfig.maxResolution.height,
            },
          },
        });

        if (isStreamActive) {
          try {
            client.current.removeVideoInputDevice('camera1');
          } catch (e) { }
          client.current.addVideoInputDevice(window.cameraStream, 'camera1', { index: 0 }); // only 'index' is required for the position parameter
        } 

        secondaryPreview.current.srcObject = window.cameraStream;
        secondaryPreview.current.onloadedmetadata = async function (e) {
          await secondaryPreview.current.play();
        };
          // client.current.attachPreview(secondaryPreview.current)
      } else {
        try {
          client.current.removeAudioInputDevice('mic1');
        } catch (e) { }
        if (window.microphoneStream) {
          for (const track of window.microphoneStream.getTracks()) {
            track.stop();
          }
        }
        window.microphoneStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId },
        });
        client.current.addAudioInputDevice(window.microphoneStream, 'mic1');
        setSelectedAudioDeviceId(deviceId);
      }
    } catch (error) {
      console.dir(error)
    }
  }

  return (
    <div className='grid grid-cols-2'>
      <div className='outline outline-1 outline-red-900 flex flex-col'>
        <canvas className='bg-black' id="mainPreview" ref={mainPreview}></canvas>
        <span className='text-red-500'>{globalError}</span>
        <div className='flex justify-center mt-2'>
          <button
            className="text-center text-indigo-400 font-bold rounded py-2 w-2/12 focus:outline-none bg-gray-900 border-2 border-indigo-400"
            onClick={(e) => {
              e.preventDefault()
              if (isStreamActive) {
                handleStreamEnd();
              } else {
                handleStreamStart()
              }
            }}
          >
            {isStreamActive ? "End Stream" : 'Start Stream'}
          </button>
        </div>
      </div>
      <div className='flex flex-col p-4'>
        <div className='flex w-full'>
          <div
            onClick={() => { setActiveTab('general') }}
            className={`flex w-1/2  cursor-pointer p-4 rounded-lg ${'general' === activeTab ? 'text-sky-900 bg-violet-200' : ''}`}>
            General
          </div>
          <div
            onClick={() => { setActiveTab('settings'); initDevices() }}
            className={`flex w-1/2 cursor-pointer  p-4 rounded-lg ${'settings' === activeTab ? 'text-sky-900 bg-violet-200' : ''}`}>
            Settings
          </div>
        </div>
        {
          'general' === activeTab && (
            <div>
              ...
            </div>
          )
        }
        {
          'settings' === activeTab && (
            <div className='outline outline-1 p-4 mt-4'>
              <div className='flex w-1/2 mx-auto'>
                <div
                  onClick={() => { setActiveSettingsTab('stream') }}
                  className={`flex w-1/2  cursor-pointer p-4 ${'stream' === activeSettingsTab ? 'text-sky-900 bg-violet-200' : ''} rounded-lg`}>
                  Stream
                </div>
                <div
                  onClick={() => { setActiveSettingsTab('other') }}
                  className={`flex w-1/2 cursor-pointer  p-4 ${'other' === activeSettingsTab ? 'text-sky-900 bg-violet-200' : ''} rounded-lg`}>
                  Other
                </div>
              </div>
              {
                'other' === activeSettingsTab && (
                  <div>
                    ...
                  </div>
                )
              }
              {
                'stream' === activeSettingsTab && (
                  <div className='mt-3'>
                    <div className="">
                      <div>
                        <span>Video devices:</span>
                        <form>
                          <select
                            onChange={(event) => handleDeviceChange('video', event.target.value)}
                            value={selectedVideoDeviceId}
                          >
                            <option value="" disabled>Select device</option>
                            {
                              videoDevices.map((device, idx) => {
                                return (
                                  <option key={idx} value={device.deviceId}>{device.label}</option>
                                )
                              })
                            }
                          </select>
                        </form>
                        {
                          videoError && (
                            <span className='text-red-600'>
                              {getPermissionErrorMessage(videoError)}
                            </span>
                          )
                        }
                        {
                          true && (
                            <div className='w-60 mt-4 bg-black'>
                              {/* <canvas className='bg-black' id="secondaryPreview" ref={secondaryPreview}></canvas> */}
                              <video autoPlay={true} muted={true} id='videoElement' ref={secondaryPreview}></video>
                            </div>

                          )
                        }
                      </div>
                      <div className='mt-5'>
                        <span>Audio devices:</span>
                        <form>
                          <select
                            onChange={(event) => handleDeviceChange('audio', event.target.value)}
                            value={selectedAudioDeviceId}
                          >
                            <option value="" disabled>Select device</option>
                            {
                              audioDevices.map((device, idx) => {
                                return (
                                  <option key={idx} value={device.deviceId}>{device.label}</option>
                                )
                              })
                            }
                          </select>
                        </form>
                        {
                          audioError && (
                            <span className='text-red-600'>
                              {getPermissionErrorMessage(audioError)}
                            </span>
                          )
                        }
                      </div>
                    </div>
                  </div>
                )
              }
            </div>
          )
        }

      </div>
    </div>
  );
}

export default App;
