# Sirius

A simple framework to manage redux store

[![npm version](https://badge.fury.io/js/redux-sirius.svg)](https://badge.fury.io/js/redux-sirius)

## Getting Started

### Install
```shell
npm i redux-sirius
```

or use [Yarn](https://yarnpkg.com/)

```shell
yarn add redux-sirius
```

### Usage

**index.js**

```js
import Sirius from 'redux-sirius'
import count from './models/count'

const store = new Sirius({
  models: {
    // and namespace for this model will set to 'count'
    count
  }
})

export default store
```

**models/count.js**

```js
import { effects } from 'redux-sirius'

const delay = duration => new Promise(resolve => setTimeout(resolve, duration))

const { put } = effects
export default {
  state: {
    loading: false,
    count: 0
  },
  reducers: {
    increment: state => ({...state, count: state.count + 1}),
    decrement: state => ({...state, count: state.count - 1}),
  },
  effects: ({takeEvery}) => ({
    asyncDecrement: takeEvery(function * () {
       yield delay(300)
       yield put({type: 'count/decrement'})
    })
  })
}
```
**Dispatch actions**

Sirius will generate reducer for each property(`loading` and `count` above) in the model's `state` field (**Only occurs when the state is an Object but not an Array**) automatically and the action type follows the rule : `<namespace>/set<uppercase first letter of the property>`.

```js
import store from './index.js'

store.dispatch({
  type: 'count/setCount',
  payload: 10
})

store.dispatch({
  type: 'count/increment'
})

store.dispatch({
  type: 'count/asyncDecrement'
})

```

For more usage examples, see `examples`

### TODO

- [ ] Redux reducer enhancer support
- [x] Complete support for all redux-saga helpers
- [ ] Model lifecycle hooks
- [ ] Customized middleawre order
- [ ] Typescript interface definitions

### LISENCE
[MIT](https://tldrlegal.com/license/mit-license)
