import { createStore } from './RxStore';
import userReducer from '../pages/user-page/userReducer';
import React from 'react';

const initState = { name: 'Harry', isLoading: false, users: [] };
export const userStore = createStore(initState, userReducer);
export const StateContext = React.createContext(initState);
