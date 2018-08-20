import * as sagaEffects from 'redux-saga/effects'

export default {
  takeLatest: (fn, ...args) => key => {
    return function * () {
      yield sagaEffects.fork(function * () {
        yield sagaEffects.takeLatest(key, fn, ...args)
      })
    }
  },
  takeEvery: (fn, ...args) => key => {
    return function * () {
      yield sagaEffects.fork(function * () {
        yield sagaEffects.takeEvery(key, fn, ...args)
      })
    }
  },
  throttle: (fn, ...args) => key => {
    const ms = args[0]
    const restArgs = args.slice(1)
    return function * () {
      yield sagaEffects.fork(function * () {
        yield sagaEffects.throttle(ms, key, fn, restArgs)
      })
    }
  }
}
