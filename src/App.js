import logo from './logo.svg';
import './App.css';
import { useRef, useEffect, useState } from 'react';
import {
  handlePermissions,
  getDevices,
} from './helpers'
import IVSBroadcastClient, {
  Errors,
  BASIC_LANDSCAPE
} from 'amazon-ivs-web-broadcast';

const streamConfig = BASIC_LANDSCAPE;

const ingestServer = process.env.INGEST_SERVER;
const streamKey = process.env.STREAM_KEY;

const tabsData = [
  {
    label: "Stream info",
    content:
      "Ut irure mollit nulla eiusmod excepteur laboris elit sit anim magna tempor excepteur labore nulla.",
  },
  {
    label: "Audio and video",
    content:
      "Fugiat dolor et quis in incididunt aute. Ullamco voluptate consectetur dolor officia sunt est dolor sint.",
  },
];

function App() {
  const client = useRef();
  const mainPreview = useRef();
  const secondaryPreview = useRef();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isPermissionsInited, setIsPermissionsInited] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState('');

  const changeActiveTab = async (idx) => {
    console.log(idx)
    setActiveTabIndex(idx);
    if (idx === 1) {
      client.current.attachPreview(secondaryPreview.current);
      if(!isPermissionsInited) {
        try {
          const permissions = await handlePermissions();
          const devices = await getDevices();
          if(devices.videoDevices.length) {
            const candidateVideoDeviceId = devices.videoDevices[0].deviceId;
            handleDeviceChange('video', candidateVideoDeviceId);
          }
          if(devices.audioDevices.length) {
            const candidateAudioDeviceId = devices.audioDevices[0].deviceId;
            handleDeviceChange('audio', candidateAudioDeviceId);
          }
          setVideoDevices(devices.videoDevices);
          setAudioDevices(devices.audioDevices);
          console.log(devices);
          console.log(permissions);
        } catch (error) {
          console.log(error);
        }
        setIsPermissionsInited(true)
      }
      
    } else {
      client.current.detachPreview(secondaryPreview.current);
    }
  }

  useEffect(() => {
    client.current = IVSBroadcastClient.create({
      // Enter the desired stream configuration
      streamConfig: IVSBroadcastClient.BASIC_LANDSCAPE,
      // Enter the ingest endpoint from the AWS console or CreateChannel API
      ingestEndpoint: ingestServer,
    });
    window.client = client.current;
  }, [])

  const handleStreamStartChange = async (e) => {
    e.preventDefault();
    try {
      const permissions = await handlePermissions();
      console.log(permissions);
    } catch (error) {
      console.log(error);
    }
  }

  const handleDeviceChange = async (type, deviceId) => {
    console.log(type, deviceId)
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
  }

  return (
    <div className='grid grid-cols-2'>
      <div className='outline outline-1 outline-red-900 flex flex-col'>
        <canvas className='bg-black' id="mainPreview" ref={mainPreview}></canvas>
        <div className='flex justify-center mt-2'>
          <button
            className="text-center text-indigo-400 font-bold rounded py-2 w-2/12 focus:outline-none bg-gray-900 border-2 border-indigo-400"
            onClick={handleStreamStartChange}
          >
            Start stream
          </button>
        </div>
      </div>
      <div className='outline outline-1 outline-yellow-900 px-4'>
        <div>
          <div className="flex space-x-3 border-b">
            {/* Loop through tab data and render button for each. */}
            {tabsData.map((tab, idx) => {
              return (
                <button
                  key={idx}
                  className={`py-2 border-b-4 transition-colors duration-300 ${idx === activeTabIndex
                    ? "border-teal-500"
                    : "border-transparent hover:border-gray-200"
                    }`}
                  // Change the active tab on click.
                  onClick={() => changeActiveTab(idx)}>
                  {tab.label}
                </button>
              );
            })}
          </div>
          {/* Show active tab content. */}
          <div className="py-4">
            <>
              <div className={`${activeTabIndex !== 0 ? 'hidden' : ''}`}>This is Stream info tab</div>
              <div className={`${activeTabIndex !== 1 ? 'hidden' : ''}`}>
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
                <div className='w-80 mt-5'>
                  <canvas className='w-80' id="secondaryPreview" ref={secondaryPreview}></canvas>
                </div>
              </div>
            </>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
