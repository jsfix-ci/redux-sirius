/* eslint-disable no-underscore-dangle */
import invariant from 'invariant'
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

  /**
   * Add model dynamically
   *
   * @param {*} model
   */
  addModel (model) {
    invariant(typeof model.namespace === 'string', 'model `namespace` field is required')
    checkModel(model)
    this._store.replaceReducer(
      mergeReducers(this._reducers, {
        [model.namespace]: createRootReducer(model, model.namespace)
      })
    )
    getSagas(model, model.namespace).forEach(this.runSaga)
    this._models.push(model)
  }

  /**
   * Create the redux store
   *
   */
  store () {
    // each sirius instance should only have one store
    invariant(!this._store, 'Only support one store')
    const config = this.config
    const reducers = {}
    const sagas = []
    for (const name of Object.keys(config.models)) {
      const model = config.models[name]
      checkModel(model)
      reducers[name] = createRootReducer(model, name)
      sagas.push(...getSagas(model, name))
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
    this._reducers = reducers
    const combinedReducer = mergeReducers(reducers)
    // eslint-disable-next-line no-undef
    if (__DEV__ && this.config.devtools.enable) {
      store = createStore(combinedReducer,
        // redux devtools support
        window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(this.config.devtools.options),
        mws)
    } else {
      store = createStore(combinedReducer, mws)
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

function getSagas (model, name) {
  const sagas = []
  for (const key of Object.keys(model.effects || {})) {
    const sagaKey = addPrefix(name)(key)
    // TODO: Only support takeEvery now
    sagas.push(function * e () {
      yield sagaEffects.fork(function * t () {
        yield sagaEffects.takeEvery(sagaKey, model.effects[key])
      })
    })
  }
  return sagas
}

/**
 * Create a root reducer based on model state and model reducers
 *
 * If you have a model like the below
 * {
 *   namespace: 'form',
 *   state: {
 *     loading: false,
 *     password: ''
 *   }
 * }
 *
 * then sirius will generate a reducer for each state field following a preset rule:
 *
 * for state loading : form/setLoading
 * for state password : form/setPassword
 *
 * If the state is not a Object , no reducer will be generated automatically. This may be improved in the future.
 *
 * @param {*} model
 * @param {*} name
 */
function createRootReducer (model, name) {
  const handlers = {}
  // auto-generate reducers
  if (!Array.isArray(model.state)) {
    for (const key of Object.keys(model.state)) {
      handlers[addSetPrefix(name)(key)] = (state, action) => ({ ...state, [key]: action.payload })
    }
  }
  // user defined reducers
  for (const r of Object.keys(model.reducers || {})) {
    const reducer = model.reducers[r]
    let finalReducer
    if (typeof reducer === 'function') {
      finalReducer = (state, action) => reducer(state, action)
    } else {
      finalReducer = (state) => state
    }
    // notice the reducer override ocurrs here
    handlers[addPrefix(name)(r)] = finalReducer
  }
  return (state = model.state, action) => (handlers[action.type] ? handlers[action.type](state, action) : state)
}

exports.effects = sagaEffects
export default Sirius
