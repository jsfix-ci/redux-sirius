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
