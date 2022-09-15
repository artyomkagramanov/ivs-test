import './App.css';
import { useRef, useEffect, useState } from 'react';
import {
  requestPermissionAndGetDevices,
} from './helpers'
import IVSBroadcastClient, {
  BASIC_LANDSCAPE
} from 'amazon-ivs-web-broadcast';

const streamConfig = BASIC_LANDSCAPE;

const ingestServer = process.env.INGEST_SERVER;


function App() {
  const client = useRef();
  const mainPreview = useRef();
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    client.current = IVSBroadcastClient.create({
      // Enter the desired stream configuration
      streamConfig: IVSBroadcastClient.BASIC_LANDSCAPE,
      // Enter the ingest endpoint from the AWS console or CreateChannel API
      ingestEndpoint: ingestServer,
    });
    window.client = client.current;
    client.current.attachPreview(mainPreview.current);
  }, [])

  const handleRequestPermission = async (e) => {
    e.preventDefault();
    try {
      const devices = await requestPermissionAndGetDevices();
      setVideoDevices(devices.videoDevices);
      setAudioDevices(devices.audioDevices);
      setErrorMessage('');
    } catch (error) {
      handlePermissionError(error);
    }
  }

  const handlePermissionError = (error) => {
    console.dir(error);
    const { name } = error;
    let message;
    switch(name) {
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
    setErrorMessage(message);
  }

  const handleDeviceChange = async (type, deviceId) => {
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
        try {
          client.current.removeVideoInputDevice(deviceId);
        } catch (e) { }
        client.current.addVideoInputDevice(window.cameraStream, deviceId, { index: 0 }); // only 'index' is required for the position parameter
      } else {
        try {
          client.current.removeAudioInputDevice(deviceId);
        } catch (e) { }
        if (window.microphoneStream) {
          for (const track of window.microphoneStream.getTracks()) {
            track.stop();
          }
        }
        window.microphoneStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId },
        });
        client.current.addAudioInputDevice(window.microphoneStream, deviceId);
        setSelectedAudioDeviceId(deviceId);
      }
    } catch (error) {
      handlePermissionError(error)
    }
  }

  return (
    <div className='grid grid-cols-2'>
      <div className='outline outline-1 outline-red-900 flex flex-col'>
        <canvas className='bg-black' id="mainPreview" ref={mainPreview}></canvas>
        <div className='flex justify-center mt-2'>
          <button
            className="text-center text-indigo-400 font-bold rounded py-2 w-2/12 focus:outline-none bg-gray-900 border-2 border-indigo-400"
            onClick={handleRequestPermission}
          >
            Request Permission
          </button>
        </div>
      </div>
      <div className='outline outline-1 outline-yellow-900 px-4'>
        <div>
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
            </div>
            <div>
              <span className='text-red-600 font-extrabold'>{errorMessage}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
