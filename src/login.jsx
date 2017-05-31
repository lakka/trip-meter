import React from 'baret';
import Bacon from 'baconjs';
import { browserHistory } from 'react-router'

const submittedB = new Bacon.Bus()
const emailB = new Bacon.Bus()
const passwordB = new Bacon.Bus()

const error = Bacon.when(
  [submittedB, emailB.toProperty(), passwordB.toProperty()],
  (_, email, pass) => ({email, pass}))
  .flatMap(form =>
    Bacon.fromPromise(fetch('/api/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(form)
    })
    .then(res => res.ok
      ? browserHistory.push('/home')
      : Promise.resolve(<div>Invalid username or password!</div>)
    ))
  )

const Login = () => 
  <div>
    <div>Login:</div>
    <form onSubmit={e => {
        e.preventDefault()
        submittedB.push(e)
      }}>
      <label>
        Email:
        <input type="text"
          onChange={e => emailB.push(e.target.value)}
        />
      </label>
      <label>
        Password:
        <input type="password"
          onChange={e => passwordB.push(e.target.value)}
        />
      </label>
      <div>{error}</div>
      <input type="submit" value="log in" onSubmit={e => submittedB.push(true)} />
    </form>
  </div>

export default Login;

