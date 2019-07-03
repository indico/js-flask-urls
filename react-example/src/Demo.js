import React, {useState} from 'react';
import flask from 'flask-urls.macro';
import './Demo.css';

const url = flask`user`;

export default function Demo() {
  const [name, setName] = useState('');
  const handleNameChange = e => setName(e.target.value.trim());

  return (
    <>
      <input
        placeholder="Enter your username"
        size="50"
        autoComplete="off"
        onChange={handleNameChange}
        className="Demo-field"
        autoFocus
      />
      <p>
        The flask url is <code className="Demo-url">{url({name})}</code>
      </p>
    </>
  );
}
