import React, { Component } from 'react'
import { connect } from 'react-redux'
import './Count.css'

class App extends Component {
  increment = () => {
    this.props.dispatch({
      type: 'count/increment'
    })
  }
  decrement = () => {
    this.props.dispatch({
      type: 'count/decrement'
    })
  }
  add = (val) => {
    this.props.dispatch({
      type: 'count/add',
      payload: val
    })
  }
  render() {
    const count = this.props.count
    return (
      <div className="App">
        current count : {count}
        <button onClick={this.increment}>+</button><button onClick={this.decrement}>-</button>
        <button onClick={() => this.add(3)}>add 3</button>
      </div>
    );
  }
}

function mapStateToProps({count}) {
  return {count}
}
export default connect(mapStateToProps)(App);
