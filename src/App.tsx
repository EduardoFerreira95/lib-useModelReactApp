import React from 'react';
import Provider from './plugin-model/Provider';
import { UseModelComponent } from './UseModel';
import './App.css';

function App() {
  return (
    <Provider>
      <UseModelComponent />
    </Provider>
  );
}

export default App;
