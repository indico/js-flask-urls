import React from 'react';
import logo from './logo.svg';
import Demo from './Demo';
import './App.css';

export default function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <Demo />
      </header>
    </div>
  );
}
