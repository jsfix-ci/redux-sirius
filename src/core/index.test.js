/* eslint-disable no-underscore-dangle */
import Sirius, { effects } from './index'

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
test('new Sirius with empty models', () => {
  const s = new Sirius()
  expect(s._models.length).toBe(0)
})

test('Model without namespace', () => {
  const app = new Sirius()
  try {
    app.model(model0)
  } catch (e) {
    expect(e.message).toBe('model\'s `namespace` [string] is required')
  }
})

test('Model without reducers', () => {
  const app = new Sirius()
  app.model({ ...model0, namespace: 'test' })
  const store = app.store()
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

test('Model default reducers', () => {
  const app = new Sirius()
  app.model({ ...model0, namespace: 'test' })
  const store = app.store()
  store.dispatch({
    type: 'test/setName',
    payload: '~~~'
  })
  const state = store.getState()
  expect(state.test.name).toBe('~~~')
})

test('Model with customized reducers', () => {
  const app = new Sirius()
  app.model({
    ...model0,
    namespace: 'test',
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
  })
  const store = app.store()
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

test('Model with sagas', async () => {
  const s = new Sirius()
  s.model({
    ...model0,
    namespace: 'test',
    effects: {
      * replaceSecondLover ({ payload }) {
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
    }
  })
  const store = s.store()
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
})
