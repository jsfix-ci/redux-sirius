import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Sirius from 'redux-sirius';
import './index.css';
import App from './Count';

const store = new Sirius({
  models: {
    count: {
      state: 0,
      reducers: {
        increment: state => state + 1,
        decrement: state => state - 1,
      }
    }
  }
}).store()
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root'));
