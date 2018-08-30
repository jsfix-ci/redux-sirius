import invariant from 'invariant'
import warning from 'warning'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import createSagaMiddleware from 'redux-saga'
import * as sagaEffects from 'redux-saga/effects'
import { addPrefix, addSetPrefix } from './utils/prefix'
import { thunkMiddleware } from './utils/thunk'
import { mergeConfig } from './utils/mergeConfig'
import helpers from './utils/sagaHelperWrappers'
import { isNotNullObject, includeKey, isNotArrayObject, pureMerge, isNode } from './utils/common'

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
    invariant(checkNS(model), `model 'namespace' is required`)
    if (!checkModel(model)) {
      warning(false, `model [${model.namespace}] has no state`)
      return
    }
    invariant(this._store, `Sirius hasn't created redux store yet. Forget to '.store()' ?`)
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
    let namespace = ''
    // model defined in 'models'
    for (const name of Object.keys(config.models)) {
      const model = config.models[name]
      // if 'namespace' is defined by user, ignore the key of model in 'models'
      namespace = name
      if (checkNS(model)) {
        namespace = model.namespace
      }
      if (!checkModel(model)) {
        warning(false, `model [${namespace}] has no state`)
        continue
      }
      this._models.push({
        namespace,
        ...model
      })
    }
    // read model files
    this._models = this._models.concat(
      readModelsFromPath(config.modelPath.path, config.modelPath.relative))
    // process all models
    for (const m of this._models) {
      const ns = m.namespace
      reducers[ns] = createRootReducer(m, ns)
      getSagas.apply(this, [m, ns])
    }
    let store
    const sagaMiddleware = createSagaMiddleware()
    const { middleware } = this.config
    let mws
    if (!Array.isArray(middleware)) {
      mws = applyMiddleware(sagaMiddleware)
    } else {
      if (config.enableThunk) {
        middleware.push(thunkMiddleware)
      }
      mws = applyMiddleware(...middleware, sagaMiddleware)
    }
    this._reducers = reducers
    const combinedReducer = mergeReducers(reducers)
    if (this.config.devtools.enable) {
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
  const finalReducer = { ...reducers, ...newReducers }
  if (!Object.keys(finalReducer).length) {
    return state => state
  }
  return combineReducers(finalReducer)
}

/**
 * Check the model
 *
 * @param {Object} model
 */
function checkModel (model) {
  return Object.keys(model).includes('state')
}

/**
 * This function read model files from specific path in your project (usually 'src/model' or 'src/models')
 * Param 'relative' decides whether to use full path as namespace or just use the file name
 *
 * Example :
 * We have a model in 'models/earth/person.js' and set `path : './models'`
 *
 * `relative : true`  =>  namespace is 'person'
 * `relative : false`  =>  namespace is 'earth/person'
 *
 * If 'namespace' is defined in the model, we use 'namespace'
 *
 * This only works in a Nodejs based project
 *
 * @param {String} dir  model files path
 * @param {Boolean} relative  'namespace' should be relative or not, default false
 */
function readModelsFromPath (dir, relative) {
  if (!isNode()) {
    warning(false, `'modelPath' requires Nodejs 'fs' and 'path'`)
    return []
  }
  // do nothing with empty path
  if (!dir) {
    return []
  }
  return readModels(dir, relative)
}

function getSagas (model, name) {
  const sagas = []
  const _effects = model.effects
  if (!_effects) {
    return []
  }
  // Normally we define sagas with String patterns in helpers like `takeLatest`.
  // But there are scenarios when we need native sagas with complex patterns.
  // See https://redux-saga.js.org/docs/api/#takeeverypattern-saga-args about patterns
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
 * And a reducer receiving action whose type is '<namespace>/merge' (in the scenario above is 'form/merge')
 * will be generated.
 * If state is an Object (not Array, not null), action payload must be a 'sub-object' of the state
 * which means all the fields of payload can be also found in the state. the 'merge' reducer will
 * do a 'merge-like' action to the state just like Object Spreading.
 *
 * If the state is not an Object, reducer replace the state with payload directly.
 *
 * @param {Object} model  model
 * @param {String} name  model namespace
 * @returns {Function}  combined reducer for the model
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
    // notice the reducer override occurs here
    handlers[addPrefix(name)(r)] = finalReducer
  }
  return (state = initialState, action) => (handlers[action.type] ? handlers[action.type](state, action) : state)
}

function checkNS (model) {
  return typeof model.namespace === 'string' && model.namespace
}

/**
 * Get namespace from file path
 *
 * @param {String} path  model file path such as 'test/sub/model.js'
 * @param {Boolean} relative  use relative namespace or not
 */
function getNamespace (path, relative) {
  let final = path
  // ignore parent path
  if (relative) {
    const s = path.split('/')
    final = s[s.length - 1]
  }
  // remove '.js'
  return final.slice(0, final.length - 3)
}

/**
 * Read all models recursively in a path
 *
 * @param {String} dir
 * @param {String} root
 * @param {Array} list
 */
function readModels (dir, relative) {
  const fs = require('fs')
  const path = require('path')
  // only '*.js' file will use as model
  const regex = /^([\w]+\/)*([\w]+\.js)$/
  const list = []
  function readRecursively (dir, root, list) {
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file)
      if (fs.statSync(filePath).isDirectory()) {
        // walk through
        readRecursively(filePath, root, list)
      } else {
        if (file.match(regex)) {
          let model = require(filePath)
          // handling es6 module
          if (model.__esModule) {
            model = model.default
          }
          // get relative path of the root path
          const pathNS = path.join(path.relative(root, dir), file)
          list.push(checkNS(model) ? model : {namespace: getNamespace(pathNS, relative), ...model})
        }
      }
    })
  }
  const p = path.resolve(__dirname, dir)
  readRecursively(p, p, list)
  return list
}

export const effects = sagaEffects
export default Sirius
