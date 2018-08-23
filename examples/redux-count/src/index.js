import React from 'react';
import ReactDOM from 'react-dom';
import 'babel-polyfill'
import { Provider } from 'react-redux';
import Sirius, { effects } from 'redux-sirius';
import './index.css';
import App from './Count';

const delay = duration => new Promise(resolve => setTimeout(resolve, duration))

const store = new Sirius({
  models: {
    count: {
      state: 0,
      reducers: {
        increment: state => state + 1,
        decrement: state => state - 1,
        add: (state, { payload }) => state + payload
      },
      effects: ({takeEvery}) => ({
        delayAdd: takeEvery(function * ({ payload }) {
          const { put } = effects
          yield delay(300)
          yield put({ type: 'count/add', payload: 3})
        })
      })
    }
  }
}).store()
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root'));
