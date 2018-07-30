const dash = '/'

export function addSetPrefix (namespace) {
  return name => (namespace ? `${namespace}${dash}set${upperCaseFirst(name)}`
    : `set${upperCaseFirst(name)}`)
}

export function addPrefix (namespace) {
  return namespace ? name => `${namespace}${dash}${name}` : name => name
}

function upperCaseFirst (s) {
  if (s.length > 1) {
    return s[0].toUpperCase() + s.substring(1, s.length)
  } else {
    return s.toUpperCase()
  }
}
