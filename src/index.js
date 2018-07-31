/* eslint-disable no-underscore-dangle,no-undef */
import invariant from 'invariant'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import createSagaMiddleware from 'redux-saga'
import * as sagaEffects from 'redux-saga/effects'
import { addPrefix, addSetPrefix } from './utils/prefix'
import { mergeConfig } from './utils/mergeConfig'

// One store guarantee

class Sirius {
  constructor (config) {
    this.config = mergeConfig(config)
    this._models = []
  }

  addModel (model) {
    checkModel(model)
    // add reducers
  }

  store () {
    invariant(!this._store, 'Only support one store')
    const config = this.config
    const reducerObj = {}
    const sagas = []
    for (const name of Object.keys(config.models)) {
      const model = config.models[name]
      checkModel(model)
      const handlers = {}
      // generate default reducers by state
      if (!Array.isArray(model.state)) {
        for (const key of Object.keys(model.state)) {
          handlers[addSetPrefix(name)(key)] = (state, action) => ({ ...state, [key]: action.payload })
        }
      }
      // add user defined reducers
      for (const r of Object.keys(model.reducers || {})) {
        const reducer = model.reducers[r]
        let finalReducer
        if (typeof reducer === 'function') {
          finalReducer = (state, action) => reducer(state, action)
        } else {
          finalReducer = (state) => state
        }
        handlers[addPrefix(name)(r)] = finalReducer
      }
      reducerObj[name] = (state = model.state, action) => (handlers[action.type] ? handlers[action.type](state, action) : state)
      for (const key of Object.keys(model.effects || {})) {
        const sagaKey = addPrefix(name)(key)
        // TODO: Only support takeEvery now
        sagas.push(function * e () {
          yield sagaEffects.fork(function * t () {
            yield sagaEffects.takeEvery(sagaKey, model.effects[key])
          })
        })
      }
      this._models.push({
        namespace: name,
        ...model
      })
    }
    let store
    const sagaMiddleware = createSagaMiddleware()
    const { middlewares } = this.config
    let mws
    if (!Array.isArray(middlewares)) {
      mws = applyMiddleware(sagaMiddleware)
    } else {
      // TODO: custom middleware order support
      mws = applyMiddleware(...middlewares, sagaMiddleware)
    }
    const rootReducer = mergeReducers(reducerObj)
    if (__DEV__ && this.config.devtools.enable) {
      store = createStore(rootReducer,
        // redux devtools support
        window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(this.config.devtools.options),
        mws)
    } else {
      store = createStore(rootReducer, mws)
    }
    sagas.forEach(sagaMiddleware.run)
    this._store = store
    this.runSaga = sagaMiddleware.run
    return store
  }
}
function mergeReducers (reducers, newReducers) {
  const finalyReduers = { ...reducers, ...newReducers }
  if (!Object.keys(finalyReduers).length) {
    return state => state
  }
  return combineReducers(finalyReduers)
}
function checkModel (model) {
  invariant(Object.keys(model).includes('state'), 'model `state` field is required')
  return model
}

exports.effects = sagaEffects
export default Sirius
