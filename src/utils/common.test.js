import { pureMerge } from './common'

const originObjectCopy = {
  string: 'test',
  number: 1,
  bool: true,
  object: {
    name: 'inner',
    value: 'nested',
    array: [1, 2, 3]
  },
  undefined: undefined,
  null: null,
  array: [
    1,
    {
      a: '123',
      b: [
        {f1: 'f1'},
        {f2: 'f2'}
      ],
      c: {
        c1: 'c1',
        c2: 2
      }
    }
  ]
}
const originObject = {
  string: 'test',
  number: 1,
  bool: true,
  object: {
    name: 'inner',
    value: 'nested',
    array: [1, 2, 3]
  },
  undefined: undefined,
  null: null,
  array: [
    1,
    {
      a: '123',
      b: [
        {f1: 'f1'},
        {f2: 'f2'}
      ],
      c: {
        c1: 'c1',
        c2: 2
      }
    }
  ]
}

// DO NOT ASK FOR Symbol :)
const notObject = [123, 'string', false, null, undefined, ['a', 'b', 'c'], () => {}]

test(`'pureMerge' doesn't work if origin is not an Object`, () => {
  for (const o of notObject) {
    expect(pureMerge(o, { name: 'test' })).toBe(o)
  }
})

test(`'pureMerge' doesn't work if payload is not an Object`, () => {
  for (const p of notObject) {
    expect(pureMerge(originObject, p)).toEqual(originObjectCopy)
  }
})

test(`'pureMerge' should apply all the payloads`, () => {
  const payloads = [
    {
      string: 'test_1',
      number: 2
    },
    {
      bool: false
    }
  ]
  const res = pureMerge(originObject, ...payloads)
  expect(res.string).toBe('test_1')
  expect(res.number).toBe(2)
})

test(`'pureMerge' ignores new fields in payloads recursively`, () => {
  const res = pureMerge(originObject, {
    string: 'test_1',
    newField: 'new',
    object: {
      name: 'inner_1',
      newField: 'new'
    }
  })
  expect(res.string).toBe('test_1')
  expect(res.newField).toBeUndefined()
  expect(res.object.name).toBe('inner_1')
  expect(res.object.newField).toBeUndefined()
})

// TODO: test array for pureMerge

test('Original object should be untouched', () => {
  expect(originObject).toEqual(originObjectCopy)
})
