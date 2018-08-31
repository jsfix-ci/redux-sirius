export const thunkMiddleware = ({dispatch, getState}) => next => async action => {
  if (typeof action === 'function') {
    return action(dispatch, getState)
  }
  return next(action)
}
