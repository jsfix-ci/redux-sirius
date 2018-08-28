# redux-sirius

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
    // and namespace for this model will be set to 'count'
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
      // count/setLoading is auto-generated
      yield put({type: 'count/setLoading', payload: true})
      yield delay(300)
      yield put({type: 'count/decrement'})
      yield put({type: 'count/setLoading', payload: false})
    })
  })
}
```
**Dispatch actions**

```js
import store from './index.js'

// all action types below are auto-generated
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
### Saga Support

### Conventional Reducers

The conventional reducers are generated automatically by 'redux-sirius' to fit requirements in most redux developing senarioes such as updating a single field of the state.

For now there are two types of conventional reducers:

If we have a model called `person` below without reducer definitions

```js
// model/person.js
export default {
  state: {
    name: 'Mike',
    sex: 0,
    weight: 100,
    height: 180,
  },
  reducers: {

  }
}
```

And register it

```js
// index.js
import person from './model/person'

const store = new Sirius({
  models: {
    person
  }
}).store()
```

Then let's dispatch actions

#### Action `<namespace>/set<uppercase the first letter of field name>`

`redux-sirius` will generate a reducer for each property in the model's `state` field (**so this only occurs when the state is an Object but not an Array**) and the action type follows the rule : `<namespace>/set<uppercase the first letter of field name>`.

```js
store.dispatch({
  type: 'person/setName',
  payload: 'Tim'
})

// Then state.person.name will be 'Tim'
```

#### Action `<namespace>/merge`

If you want to updating multiple fields of the state, this reducer will be very helpful.

But you need to pay extra attention when using this:
- Although 'merge' reducer is powerful and convenient, it's recommended to use 'set-prefiexed' reducer to **update a single field** of the state because 'merge' is not as specific as 'setXXX' when dispatching the action and 'merge' reducer does extra checking to ensure not bringing new field into the state to avoid making codes more confused.
- Only the fields that the state include will be merged in the payload.
- If the state is not an Object or 'un-spreadable' (primitive type state like `{ state:0 }`), this reducer will replace the state with payload directly.

```js
store.dispatch({
  type: 'person/merge',
  payload: {
    name: 'Tim',
    height: 170,
    from: 'Mars'
  }
})
// 'name' and 'height' works and 'from' is ignored
```

### Config Options

## TODO

- [ ] Redux reducer enhancer support
- [x] Complete support for all redux-saga helpers
- [ ] Model lifecycle hooks
- [ ] Typescript interface definitions

## LISENCE
[MIT](https://tldrlegal.com/license/mit-license)
