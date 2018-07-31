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
  render() {
    const count = this.props.count
    return (
      <div className="App">
        current count : {count}
        <button onClick={this.increment}>+</button><button onClick={this.decrement}>-</button>
      </div>
    );
  }
}

function mapStateToProps({count}) {
  return {count}
}
export default connect(mapStateToProps)(App);
