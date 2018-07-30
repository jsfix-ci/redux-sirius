/* eslint-disable no-underscore-dangle,no-undef */
import invariant from 'invariant'
import { handleActions } from 'redux-actions'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import createSagaMiddleware from 'redux-saga'
import * as sagaEffects from 'redux-saga/effects'
import { addPrefix, addSetPrefix } from './utils/prefix'
import { mergeConfig } from './utils/mergeConfig'

class Sirius {
  constructor (config) {
    this.config = mergeConfig(config)
    this._models = []
  }
  model (m) {
    checkModel(m)
    this._models.push(m)
  }

  models (...models) {
    // TODO: directly read model from path
    for (const m of models) {
      this.model(m)
    }
  }

  store () {
    const models = this._models
    const reducerObj = {}
    const sagas = []
    for (const model of models) {
      // TODO: use file name as namespace
      const handlers = {}
      // generate default reducers by state
      for (const key of Object.keys(model.state)) {
        handlers[addSetPrefix(model.namespace)(key)] = (state, action) => ({ ...state, [key]: action.payload })
      }
      // add user defined reducers
      if (model.reducers) {
        for (const r of Object.keys(model.reducers)) {
          handlers[addPrefix(model.namespace)(r)] = model.reducers[r]
        }
      }
      reducerObj[model.namespace] = handleActions(handlers, model.state)
      if (model.effects) {
        for (const key of Object.keys(model.effects)) {
          const sagaKey = addPrefix(model.namespace)(key)
          // TODO: Only support takeEvery now
          sagas.push(function * e () {
            yield sagaEffects.fork(function * t () {
              yield sagaEffects.takeEvery(sagaKey, model.effects[key])
            })
          })
        }
      }
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
    if (__DEV__ && this.config.devTools) {
      store = createStore(combineReducers(reducerObj),
        // redux devtools support
        window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
        mws)
    } else {
      store = createStore(combineReducers(reducerObj), mws)
    }
    sagas.forEach(sagaMiddleware.run)
    return store
  }
}
function checkModel (model) {
  invariant(model.namespace && typeof model.namespace === 'string', 'model\'s `namespace` [string] is required')
  invariant(model.namespace.trim().length !== 0, `Invalid \`namespace\` : [${model.namespace}]`)
  invariant(model.state, 'model\'s `state` is required')
  // TODO: check duplicate namespace
  return model
}

exports.effects = sagaEffects
export default Sirius
