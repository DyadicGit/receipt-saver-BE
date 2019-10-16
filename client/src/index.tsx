import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import { scan, tap } from 'rxjs/operators';
import App from './App';
import { userStore } from './rxjs-as-redux/storeInstances';
import { merge } from 'rxjs';
import { StateContext } from './rxjs-as-redux/storeInstances';

const container = document.getElementById('root');

const appStores$ = merge(userStore.store$).pipe(
  scan((acc, state) => ({ ...acc, ...state })),
  tap(a => console.log(a))
);

appStores$.subscribe(state =>
  ReactDOM.render(
    <StateContext.Provider value={state}>
      <App />
    </StateContext.Provider>,
    container
  )
);

serviceWorker.register();
