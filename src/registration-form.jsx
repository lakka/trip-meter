import React from 'baret'
import Bacon from 'baconjs'
import { browserHistory } from 'react-router'
const emailRegexp = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/

const emailB = new Bacon.Bus()
const emailExistsB = new Bacon.Bus()
const apiResponseB = new Bacon.Bus()
const passwordB = new Bacon.Bus()
const passwordAgainB = new Bacon.Bus()
const submittedB = new Bacon.Bus()

const emailDebounced = emailB.debounce(800)
const emailSyntaxB = emailDebounced
  .filter(email => !email.match(emailRegexp))

const errorDiv = (id, msg) => <div id={id} className='error'>{msg}</div>

const validatingEmailB = emailDebounced
  .filter(email => email.match(emailRegexp))
  .filter(email => fetch(`/api/exists/${email}`)
    .then(res => res.ok
      ? res.json()
      : Promise.reject(res)
    )
    .then(res => emailExistsB.push(res))
    .catch(err => emailExistsB.error(err))
  )

emailExistsB.mapError(e => true).zip(validatingEmailB)
  .filter(([exists]) => !exists)
  .onValue(([exists, email]) => 
    fetch(`/api/check/${email}`)
      .then(res => res.ok
        ? res.json()
        : Promise.reject(res)
      )
      .then(res => apiResponseB.push(res))
      .catch(err => apiResponseB.error(err))
    )

const emailState = Bacon.update(
  <div>&nbsp;</div>,
  [emailSyntaxB], () => errorDiv('email-syntax-error', 'Erroneous email'),
  [validatingEmailB], () => <div>Validating email...</div>,
  [emailExistsB], (prev, val) => val
    ? errorDiv('email-exists-error', 'There is already an account associated with this email!')
    : prev,
  [apiResponseB], (prev, res) => res
    ? <div>Email OK!</div>
    : errorDiv('email-trip-error', 'Please use the same email account as in your membership application to TRIP!')
)
.mapError(err => errorDiv('email-server-error', 'Server error! Please try again.'))

const emailOkP = apiResponseB.toProperty()

const passwordOkP = passwordB
  .debounce(800)
  .map(pass => (pass.length > 7))
  .toProperty()

const passwordState = passwordOkP.map(b => b
    ? <div>&nbsp;</div>
    : errorDiv('pass-syntax-error', 'Password too short!')
  )
  .startWith(<div>&nbsp;</div>)

const passwordsMatchOkP = Bacon.combineWith(
  (pass, passAgain) => pass === passAgain,
  passwordB.toProperty(),
  passwordAgainB.toProperty()
  )
  .debounce(800)

const passwordsMatchState = passwordsMatchOkP.map(b => b
    ? <div>&nbsp;</div>
    : errorDiv('pass-no-match-error', 'Passwords don\'t match')
  )
  .startWith(<div>&nbsp;</div>)

const submittableP = emailOkP.and(passwordOkP).and(passwordsMatchOkP).startWith(false).toProperty()

const validSubmissionP = submittedB.toProperty().and(submittableP).filter(v => v)

Bacon.combineWith(
  (valid, email, pass) => ({email, pass}),
  validSubmissionP,
  emailB.toProperty(),
  passwordB.toProperty()
).onValue(form => {
  fetch('/api/register', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(form),
  })
  .then(res => res.ok ? res.json() : Promise.reject()) 
  .then(form =>
    fetch('/api/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(form)
    })
  )
  .then(res => res.ok ? Promise.resolve() : Promise.reject())
  .then(() => browserHistory.push('/home'))
  .catch(console.log)
})

const RegistrationForm = () => 
      <div>
        <div>Register a new user:</div>
        <form onSubmit={e => {
            e.preventDefault()
            submittedB.push(e)
          }}>
          <label>
            Email:
            <input type="text" id="email"
              onChange={e => emailB.push(e.target.value)}
            />
            <div>{emailState}</div>
          </label>
          <label>
            Password:
            <input type="password" id="password"
              onChange={e => passwordB.push(e.target.value)}
            />
            <div>{passwordState}</div>
          </label>
          <label>
            Password again:
            <input type="password" id="password-again"
              onChange={e => passwordAgainB.push(e.target.value)}
            />
            <div>{passwordsMatchState}</div>
          </label>
          <input type="submit" value="submit" id="submit" disabled={submittableP.not()} />
        </form>
      </div>

export default RegistrationForm

