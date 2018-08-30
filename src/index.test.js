/* eslint-disable no-underscore-dangle */
import Sirius, {effects} from './index'

const delay = duration => new Promise(resolve => setTimeout(resolve, duration))
// no namespace / no reducers / no effects
const model0 = {
  state: {
    name: 'fuck',
    value: 0,
    info: {
      height: 180,
      weight: 150
    },
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

test('Sirius instance with empty models', () => {
  const s = new Sirius()
  s.store()
  expect(s._models.length).toBe(0)
})

test(`Model 'namespace' should be the key in config if not defined`, () => {
  const s = new Sirius({
    models: {
      test: model0
    }
  })
  s.store()
  expect(s._models[0].namespace).toBe('test')
})

test(`Should use model 'namespace' field if defined`, () => {
  const s = new Sirius({
    models: {
      test: {
        namespace: 'person',
        ...model0
      }
    }
  })
  s.store()
  expect(s._models[0].namespace).toBe('person')
})

test(`Model 'state' should be added into the store`, () => {
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
    info: {
      height: 180,
      weight: 150
    },
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

test('Model should have default \'set-prefixed\' reducers', () => {
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

test('Model should have \'merge\' reducer', () => {
  const s = new Sirius({
    models: {
      test: model0
    }
  })
  const store = s.store()
  store.dispatch({
    type: 'test/merge',
    payload: {
      name: 'merge',
      value: 999
    }
  })
  const state = store.getState()
  expect(state.test.name).toBe('merge')
  expect(state.test.value).toBe(999)
})

test('\'merge\' reducer only merge the existent field of state', () => {
  const store = new Sirius({
    models: {
      test: model0
    }
  }).store()
  store.dispatch({
    type: 'test/merge',
    payload: {
      name: 'merge',
      job: 'student',
      info: {
        height: 150,
        address: 'test address'
      }
    }
  })
  const state = store.getState()
  // 'name' works
  expect(state.test.name).toBe('merge')
  // ignore 'job'
  expect(state.test.job).toBeUndefined()
  // ignore 'info.address'
  expect(state.test.info).toEqual({
    height: 150,
    weight: 150
  })
})

test('Model \'reducers\' should be added as reducers ', () => {
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
            const newLovers = lovers.map((lover, i) => {
              if (i !== 0) {
                return lover
              }
              return {
                ...lover,
                ...payload
              }
            })
            return {
              ...state,
              lovers: [...newLovers]
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

test('Actions without `payload` do nothing to the state', () => {
  const store = new Sirius({
    models: {
      test: model0
    }
  }).store()
  store.dispatch({type: 'test/setName'})
  const state = store.getState()
  expect(state.test.name).toBe('fuck')
})

test('Model \'effects\' should be added as sagas', async () => {
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
              yield call(delay, 500)
              yield put({
                type: 'test/setLovers',
                payload: [...lovers.slice(0, 1), payload, ...lovers.slice(2)]
              })
            }
          ),
          addLover: takeEvery(
            function * ({ payload }) {
              const { put, select, call } = effects
              yield call(delay, 300)
              const lovers = yield select(state => state.test.lovers)
              yield put({
                type: 'test/setLovers',
                payload: [...lovers.slice(), payload]
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
  await delay(800)
  let state = store.getState()
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
    type: 'test/addLover',
    payload: lover3
  })
  await delay(400)
  state = store.getState()
  expect(state.test.lovers[2]).toEqual(lover3)
})

test(`Shouldn't read models if 'config.path' is empty`, () => {
  const s = new Sirius({
    fileModels: {
      path: ''
    }
  })
  const store = s.store()
  expect(store.getState()).toBeUndefined()
  expect(s._models).toEqual([])
})

test(`Should read models in 'config.path' and add them to the store`, () => {
  const s = new Sirius({
    fileModels: {
      path: '../testdata/model'
    }
  })
  const store = s.store()
  expect(store.getState()).toEqual(
    { model3: 'model3',
      '@@@@@@@test': 'model1',
      'test1/sub/model0': 'model0',
      'test2/model2': 'model2' }
  )
  store.dispatch({
    type: 'model3/merge',
    payload: 'model3 changed'
  })
  expect(store.getState().model3).toBe('model3 changed')
})

test(`'addModel' should apply model into the store`, async () => {
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

test(`'addModel' should fail if model has no namespace`, () => {
  const s = new Sirius()
  try {
    s.addModel({
      state: 'test model'
    })
  } catch (error) {
    expect(error.message).toBe(`model 'namespace' is required`)
  }
})

test(`'addModel' should fail if model namespace is empty`, () => {
  const s = new Sirius()
  try {
    s.addModel({
      namespace: '',
      state: 'test model'
    })
  } catch (error) {
    expect(error.message).toBe(`model 'namespace' is required`)
  }
})

test(`'addModel' should not add a model without state`, () => {
  const s = new Sirius({
    models: {
      test: {
        state: 'test'
      }
    }
  })
  const store = s.store()
  expect(store.getState()).toEqual({
    test: 'test'
  })
  s.addModel({
    namespace: 'test2'
  })
  expect(store.getState()).toEqual({
    test: 'test'
  })
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

test('Middleware should be added', () => {
  let flag = 0
  const myMiddleware = ({dispatch, getState}) => next => action => {
    if (action.type === 'test/middleware') {
      flag += 1
    }
    return next(action)
  }
  const store = new Sirius({
    middleware: [myMiddleware]
  }).store()
  store.dispatch({type: 'test/middleware'})
  expect(flag).toBe(1)
})

// This test must be executed after all the tests finish running
test('Model should be untouched', () => {
  expect(model0.state).toEqual(
    {
      name: 'fuck',
      value: 0,
      info: {
        height: 180,
        weight: 150
      },
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
  )
})
