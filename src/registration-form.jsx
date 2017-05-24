import React from 'baret';
import Bacon from 'baconjs';
const emailRegexp = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/

const emailB = new Bacon.Bus()
const apiResponseB = new Bacon.Bus()
const passwordB = new Bacon.Bus()
const passwordAgainB = new Bacon.Bus()
const submittedB = new Bacon.Bus()

const emailDebounced = emailB.debounce(800)
const emailSyntaxB = emailDebounced
  .filter(email => !email.match(emailRegexp))

const validatingEmailB = emailDebounced
  .filter(email => email.match(emailRegexp))
  .filter(e => fetch(`http://localhost:3001/check/${e}`)
    .then(res => res.json())
    .then(res => apiResponseB.push(res))
  )

const emailState = Bacon.when(
    [emailSyntaxB], () => <div style={{color:'red'}}>Erroneous email</div>,
    [validatingEmailB], () => <div>Validating email...</div>,
    [apiResponseB], (res) => res
      ? <div>Email OK!</div>
      : <div style={{color:'red'}}>Please use the same email account as in your membership application to TRIP!</div>
  )

const emailOkP = apiResponseB.toProperty()

const passwordOkP = passwordB
  .debounce(800)
  .map(pass => (pass.length > 7))
  .toProperty()

const passwordState = passwordOkP.map(b => b
    ? false
    : <div style={{color:'red'}}>Password too short</div>
  )
const passwordsMatchOkP = Bacon.combineWith(
  (pass, passAgain) => pass === passAgain,
  passwordB.toProperty(),
  passwordAgainB.toProperty()
  )
  .debounce(800)

const passwordsMatchState = passwordsMatchOkP.map(b => b
    ? false
    : <div style={{color:'red'}}>Passwords don't match</div>
  )

const notSubmittable = emailOkP.and(passwordOkP).and(passwordsMatchOkP).not().startWith(true).toProperty()

submittedB.toProperty().and(notSubmittable.not()).onValue(alert)

const RegistrationForm = () => 
      <div>
        <div>Register a new user:</div>
        <form onSubmit={event => submittedB.push(true)}>
          <label>
            Email:
            <input type="text"
              onChange={event => emailB.push(event.target.value)}
            />
            <div>{emailState}</div>
          </label>
          <label>
            Password:
            <input type="password"
              onChange={event => passwordB.push(event.target.value)}
            />
            <div>{passwordState}</div>
          </label>
          <label>
            Password again:
            <input type="password"
              onChange={event => passwordAgainB.push(event.target.value)}
            />
            <div>{passwordsMatchState}</div>
          </label>
          <input type="submit" value="submit" disabled={notSubmittable} />
        </form>
      </div>

export default RegistrationForm;

