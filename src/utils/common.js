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
export const deriveObject = (obj, ...payloads) => {
  const originKeys = Object.keys(obj)
  return payloads.reduce((o, payload) => {
    // use '.reduce' instead of for-loop to improve performance ?
    for (const k of Object.keys(payload)) {
      if (originKeys.length === 0) {
        o = payload
      } else {
        if (originKeys.includes(k)) {
          const _old = o[k]
          const _new = payload[k]
          if (isNotNullObject(_old) && isNotNullObject(_new)) {
            o[k] = deriveObject(_old, _new)
          } else {
            o[k] = payload[k]
          }
        }
      }
    }
    return o
  }, obj)
}
