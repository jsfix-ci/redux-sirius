/* eslint-disable no-underscore-dangle */
import invariant from 'invariant'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import createSagaMiddleware from 'redux-saga'
import * as sagaEffects from 'redux-saga/effects'
import { addPrefix, addSetPrefix } from './utils/prefix'
import { thunkMiddleware } from './utils/thunk'
import { mergeConfig } from './utils/mergeConfig'
import helpers from './utils/sagaHelperWrappers'
import { isNotNullObject, includeKey, isNotArrayObject, pureMerge } from './utils/common'

class Sirius {
  constructor (config) {
    this.config = mergeConfig(config)
    this._models = []
    this._effects = []
    this._sagas = []
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
    getSagas.apply(this, [model, model.namespace]).forEach(this.runSaga)
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
    for (const name of Object.keys(config.models)) {
      const model = config.models[name]
      checkModel(model)
      reducers[name] = createRootReducer(model, name)
      getSagas.apply(this, [model, name])
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
      if (config.enableThunk) {
        middlewares.push(thunkMiddleware)
      }
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
    this._sagas.forEach(sagaMiddleware.run)
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
  const _effects = model.effects
  if (!_effects) {
    return []
  }
  // Normally we define sagas with String patterns in helpers like `takeLatest`.
  // But there are senarioes when we need native sagas with complex patterns.
  // See https://redux-saga.js.org/docs/api/#takeeverypattern-saga-args about partterns
  if (typeof _effects === 'function') {
    const effects = _effects(helpers)
    for (const key of Object.keys(effects) || []) {
      const sagaKey = addPrefix(name)(key)
      sagas.push(effects[key](sagaKey))
    }
  } else if (Array.isArray(_effects)) {
    for (const s of _effects || []) {
      sagas.push(function * e () {
        yield sagaEffects.fork(s)
      })
    }
  } else if (typeof _effects === 'object') {
    // Object effects must follow the pattern `{ default, native }` which
    // 'default' represents for the functional model-scoped sirius sagas
    // and 'native' represents for the native redux sagas
    if (_effects.default && typeof _effects.default) {
      const effects = _effects.default(helpers)
      for (const key of Object.keys(effects) || []) {
        const sagaKey = addPrefix(name)(key)
        sagas.push(effects[key](sagaKey))
      }
    }
    if (_effects.native && Array.isArray(_effects.native)) {
      for (const s of _effects.native || []) {
        sagas.push(function * e () {
          yield sagaEffects.fork(s)
        })
      }
    }
  } else {
    invariant(false, 'Effects must be array, function or object')
  }
  this._sagas = this._sagas.concat(sagas)
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
 * And a reducer receiving action whose type is '<namespace>/merge' (in the senario above is 'form/merge')
 * will be generated.
 * If state is an Object (not Array, not null), action payload must be a 'sub-object' of the state
 * which means all the fields of payload can be also found in the state. the 'merge' reducer will
 * do a 'merge-like' action to the state just like Object Spreading.
 *
 * If the state is not an Object, reducer replace the state with payload directly.
 *
 * @param {*} model
 * @param {*} name
 */
function createRootReducer (model, name) {
  const handlers = {}
  const initialState = model.state
  // auto-generated reducers
  if (isNotNullObject(initialState)) {
    for (const key of Object.keys(initialState)) {
      handlers[addSetPrefix(name)(key)] = (state, action) => includeKey(action, 'payload') ? { ...state, [key]: action.payload } : state
    }
  }
  // reducer for updating multiple field of the state in one action
  // or replace the state directly
  handlers[addPrefix(name)('merge')] = (state, action) => {
    if (!includeKey(action, 'payload')) {
      return state
    }
    const payload = action.payload
    if (isNotArrayObject(state)) {
      // if (includeNewKeys(state, payload)) {
      //   return pureMerge(state, payload)
      // } else {
      //   return { ...state, ...payload }
      // }
      return pureMerge(state, payload)
    } else {
      return payload
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

export const effects = sagaEffects
export default Sirius
