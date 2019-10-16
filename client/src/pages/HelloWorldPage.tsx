import React, { useState, useEffect } from 'react';
import { landingPageUrl } from '../config/endpoints';

export default () => {
  const [text, setText] = useState('');
  useEffect(() => {
    fetch(landingPageUrl)
      .then(response => response.text())
      .then(setText);
  }, []);
  return (
    <>
      <h1>{text}</h1>
    </>
  );
};
