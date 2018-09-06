// Argument is an Object but not array
// About typeof null === 'object' See http://2ality.com/2013/10/typeof-null.html
export const isNotArrayObject = a => typeof a === 'object' && !Array.isArray(a)
export const isNotNullObject = a => isNotArrayObject(a) && a !== null

// Return whether the object has the given key
export const includeKey = (obj, key) => (isNotArrayObject(obj) ? Object.keys(obj).includes(key) : false)

// The 'obj' and 'payloads' should be objects but not arrays
// and only compare properties in the first level.
export const includeNewKeys = (obj, ...payloads) => {
  const originKeys = Object.keys(obj)
  const allKeys = Object.keys(obj).concat(payloads.reduce((keys, p) => keys.concat(Object.keys(p)), []))
  return originKeys.length !== new Set(allKeys).size
}

// 'obj' and 'payloads' should be an Object but not an array
// ignore the prototype of 'obj'
export const pureMerge = (obj, ...payloads) => payloads.reduce((res, payload) => {
  if (!isNotNullObject(res)) { return res }
  const originKeys = Object.keys(res)
  // empty origin object, use payload as next
  if (originKeys.length === 0) {
    return payload
  } else {
    if (!isNotNullObject(payload)) { return res }
    const payloadKeys = Object.keys(payload)
    // do merge
    return payloadKeys.reduce((_res, key) => {
      // ignore new field
      if (originKeys.includes(key)) {
        const _old = _res[key]
        const _new = payload[key]
        // both old and new value are Objects, merge recursively
        if (isNotNullObject(_old) && isNotNullObject(_new)) {
          return {
            ..._res,
            [key]: pureMerge(_old, _new)
          }
        } else {
          return {
            ..._res,
            [key]: _new
          }
        }
      }
      return _res
    }, res)
  }
}, obj)

// Detect the js env is Node or not
export const isNode = () => typeof process !== 'undefined' && process.versions != null && process.versions.node != null
