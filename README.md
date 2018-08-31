# redux-sirius

[![npm version](https://img.shields.io/npm/v/redux-sirius.svg?colorB=green)](https://www.npmjs.com/package/redux-sirius)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A simple framework to manage redux store

## Content
* [Installation](#installation)
* [Usage](#usage)
* [Model](#model)
* [Conventional Reducers](#conventional-reducers)
   - [Set-Prefixed Reducers](#set-prefixed-reducers)
   - [Merge Reducer](#merge-reducer)
* [Saga Support](#saga-support)
* [Config Options](#config-options)
* [API Reference](#api-reference)

## Installation
```shell
npm i redux-sirius
```

or use [Yarn](https://yarnpkg.com/)

```shell
yarn add redux-sirius
```

## Usage

**index.js**

```js
import Sirius from 'redux-sirius'
import count from './models/count'

const store = new Sirius({
  models: {
    // and namespace for this model will be set to 'count'
    count
  }
}).store()

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

// 'count/setCount' is auto-generated
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
## Model

> todo

## Conventional Reducers

The conventional reducers are generated automatically by 'redux-sirius' to fit requirements in most redux developing scenarios such as updating a single field of the state.

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

### Set-Prefixed Reducers

action type:
```
<namespace>/set<uppercase the first letter of field name>
```

`redux-sirius` will generate a reducer for each field in the model's `state` (**this only occurs when the state is an Object but not an Array**) and action type follows the rule : `<namespace>/set<uppercase the first letter of field name>`.

Example:

```js
store.dispatch({
  type: 'person/setName',
  payload: 'Tim'
})

// Then state.person.name will be 'Tim'
```
Then `state.person.name` will be 'Tim'
```diff
{
  person: {
-   name: 'Mike',
+   name: 'Tim',
    sex: 0,
    weight: 100,
    height: 180,
  }
}
```

### Merge Reducer

action type:
```
<namespace>/merge
```

If you want to update multiple state fields, this reducer will be very helpful.

But you need to pay extra attention when using this:
- Although `merge` reducer is powerful and convenient, **it's highly recommended to use `set-prefixed` reducer to update a single state field** because `merge` is not as specific as `setXXX` when dispatching the action and `merge` reducer does extra checking to ensure not bringing new field into the state to avoid making codes more confused.
- `merge` follows the rules below:
   - Only the fields that state includes will be merged in the payload. But if the original field value is `{}`, it'll be directly replaced by payload.
   - If original field value is not a 'spreadable' Object or is an Array, this reducer will replace it with payload directly.
- `merge` works fine with nested objects but do not abuse it when your state is very complicated and nested deeply because it's hard to trace the state changing flow.

Example :

```js
store.dispatch({
  type: 'person/merge',
  payload: {
    name: 'Tim',
    height: 170,
    from: 'Mars'
  }
})
//
```
`name` and `height` changed but `from` is ignored
```diff
{
  person: {
-   name: 'Mike',
+   name: 'Tim',
    sex: 0,
    weight: 100,
-   height: 180,
+   height: 170,
  }
}
```
## Saga Support

> TODO

## Config Options

> TODO

## API Reference
### Init a redux-sirius instance

* `new Sirius(config)`

### sirius instance

* `store()`
* `addModel(model)`

### Store

* `getState()`
* `dispatch(action)`

## TODO

- [ ] Redux reducer enhancer support
- [x] Complete support for all redux-saga helpers
- [ ] Model life cycle hooks
- [ ] Typescript interface definitions

## LICENCE
[MIT](https://tldrlegal.com/license/mit-license)
