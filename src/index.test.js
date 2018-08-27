/* eslint-disable no-underscore-dangle */
import Sirius, {effects} from './index'

const delay = duration => new Promise(resolve => setTimeout(resolve, duration))
// no namespace / no reducers / no effects
const model0 = {
  state: {
    name: 'fuck',
    value: 0,
    lovers: [
      {
        name: 'qwe',
        sex: 1
      },
      {
        name: 'ewq',
        sex: 0
      }
    ]
  }
}
test('Should only exist one redux store', () => {
  const s = new Sirius()
  s.store()
  try {
    s.store()
  } catch (e) {
    expect(e.message).toBe('Only support one store')
  }
})
test('Sirius with empty models', () => {
  const s = new Sirius()
  s.store()
  expect(s._models.length).toBe(0)
})

test('Model\'s namespace should be the key in config', () => {
  const s = new Sirius({
    models: {
      test: model0
    }
  })
  s.store()
  expect(s._models[0].namespace).toBe('test')
})

test('Model\'s `state` should be add into the store', () => {
  const s = new Sirius({
    models: {
      test: model0
    }
  })
  const store = s.store()
  const state = store.getState()
  expect(state.test).toEqual({
    name: 'fuck',
    value: 0,
    lovers: [
      {
        name: 'qwe',
        sex: 1
      },
      {
        name: 'ewq',
        sex: 0
      }
    ]
  })
})

test('Model should have default reducers', () => {
  const s = new Sirius({
    models: {
      test: model0
    }
  })
  const store = s.store()
  expect(s._reducers.test).toBeDefined()
  store.dispatch({
    type: 'test/setName',
    payload: '~~~'
  })
  const state = store.getState()
  expect(state.test.name).toBe('~~~')
})

test('Model\'s `reducers` should be added as reducers ', () => {
  const store = new Sirius({
    models: {
      test: {
        ...model0,
        reducers: {
          setName: (state, { payload }) => {
            if (payload === 'test') {
              return { ...state, name: 'hello world' }
            } else {
              return { ...state, name: payload }
            }
          },
          setFirstLover: (state, { payload }) => {
            const { lovers } = state
            lovers[0] = payload
            return {
              ...state,
              lovers
            }
          }
        }
      }
    }
  }).store()
  store.dispatch({
    type: 'test/setName',
    payload: 'test'
  })
  store.dispatch({
    type: 'test/setFirstLover',
    payload: {
      name: 'good man',
      sex: '?'
    }
  })
  const state = store.getState()
  expect(state.test.name).toBe('hello world')
  expect(state.test.lovers[0]).toEqual({
    name: 'good man',
    sex: '?'
  })
})

test('Model\'s `effects` should be added as sagas', async () => {
  const store = new Sirius({
    models: {
      test: {
        ...model0,
        effects: ({takeLatest, takeEvery}) => ({
          replaceSecondLover: takeLatest(
            function * ({ payload }) {
              const { put, select, call } = effects
              yield put({
                type: 'test/setName',
                payload: 'bad man'
              })
              yield call(delay, 200)
              const lovers = yield select(state => state.test.lovers)
              lovers[1] = payload
              yield call(delay, 500)
              yield put({
                type: 'test/setLovers',
                payload: lovers
              })
            }
          ),
          add3rdLover: takeEvery(
            function * ({ payload }) {
              const { put, select, call } = effects
              yield call(delay, 300)
              const lovers = yield select(state => state.test.lovers)
              lovers.push(payload)
              yield put({
                type: 'test/setLovers',
                payload: lovers
              })
            }
          )
        })
      }
    }
  }).store()
  store.dispatch({
    type: 'test/replaceSecondLover',
    payload: {
      name: 'bad man',
      sex: 10
    }
  })
  await delay(700)
  const state = store.getState()
  expect(state.test.name).toBe('bad man')
  expect(state.test.lovers[1]).toEqual({
    name: 'bad man',
    sex: 10
  })
  const lover3 = {
    name: 'jesus',
    sex: null
  }
  store.dispatch({
    type: 'test/add3rdLover',
    payload: lover3
  })
  await delay(300)
  expect(state.test.lovers[2]).toEqual(lover3)
})

test('Dynamic add model', async () => {
  const s = new Sirius({
    models: {
      switch: {
        state: true,
        reducers: {
          switch: state => !state
        }
      }
    }
  })
  const store = s.store()
  let state = store.getState()
  expect(state.switch).toBe(true)
  s.addModel({
    namespace: 'counter',
    state: 0,
    reducers: {
      increment: state => state + 1,
      decrement: state => state - 1
    },
    effects: ({takeEvery}) => ({
      asyncSwitch: takeEvery(function * () {
        const { put } = effects
        yield delay(300)
        yield put({type: 'switch/switch'})
      })
    })
  })
  state = store.getState()
  expect(state.counter).toBe(0)
  store.dispatch({type: 'counter/increment'})
  store.dispatch({type: 'counter/asyncSwitch'})
  await delay(300)
  state = store.getState()
  expect(state.counter).toBe(1)
  expect(state.switch).toBe(false)
})

test('Default enable thunk middleware', async () => {
  const s = new Sirius({
    models: {
      count: {
        state: 0
      }
    }
  })
  expect(s.config.enableThunk).toBe(true)
  let test = false
  const store = s.store()
  store.dispatch(async () => {
    await delay(1000)
    test = true
  })
  await delay(1000)
  expect(test).toBe(true)
})

test('Disable the thunk middleware', async () => {
  const s = new Sirius({
    enableThunk: false
  })
  expect(s.config.enableThunk).toBe(false)
  const store = s.store()
  try {
    store.dispatch(async () => {})
  } catch (error) {
    expect(error.message).toBe('Actions must be plain objects. Use custom middleware for async actions.')
  }
})

test('Middlewares should be added', () => {
  let flag = 0
  const customeMiddleware = ({dispatch, getState}) => next => action => {
    if (action.type === 'test/middleware') {
      flag += 1
    }
    return next(action)
  }
  const store = new Sirius({
    middlewares: [customeMiddleware]
  }).store()
  store.dispatch({type: 'test/middleware'})
  expect(flag).toBe(1)
})
