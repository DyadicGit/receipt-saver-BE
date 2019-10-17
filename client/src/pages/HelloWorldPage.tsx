import React, { useState, useEffect } from 'react';
import { helloWorldApi } from '../config/endpoints';

export default () => {
  const [text, setText] = useState('');
  useEffect(() => {
    fetch(helloWorldApi)
      .then(response => response.text())
      .then(setText);
  }, []);
  return (
    <>
      <h1>{text}</h1>
    </>
  );
};
