import React, { useContext } from 'react';
import { useModel } from './plugin-model/hook';

export function UseModelComponent(): JSX.Element {
  const useCounter = useModel('useCounter');

  console.log({ useCounter });

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center' }}>
      <header>Teste</header>
      {/* <h1>Hook: {data}</h1>
      <button onClick={() => handleClick('increment')}>Increment</button>
      <button onClick={() => handleClick('decrement')}>Decrement</button> */}
    </div>
  )
}
