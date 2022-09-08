import logo from './logo.svg';
import './App.css';
import { useRef, useEffect } from 'react';
import IVSBroadcastClient, {
  Errors,
  BASIC_LANDSCAPE
} from 'amazon-ivs-web-broadcast';

const ingestServer = '';
const streamKey = '';
const client = IVSBroadcastClient.create({
  // Enter the desired stream configuration
  streamConfig: IVSBroadcastClient.BASIC_LANDSCAPE,
  // Enter the ingest endpoint from the AWS console or CreateChannel API
  ingestEndpoint: ingestServer,
});

function App() {
  const client = IVSBroadcastClient.create({
    // Enter the desired stream configuration
    streamConfig: IVSBroadcastClient.BASIC_LANDSCAPE,
    // Enter the ingest endpoint from the AWS console or CreateChannel API
    ingestEndpoint: ingestServer,
});

  // useEffect(() => {
  //   client.current = IVSBroadcastClient.create({
  //       // Enter the desired stream configuration
  //       streamConfig: IVSBroadcastClient.BASIC_LANDSCAPE,
  //       // Enter the ingest endpoint from the AWS console or CreateChannel API
  //       ingestEndpoint: ingestServer,
  //   });
  // }, [])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
