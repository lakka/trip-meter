import React from 'baret';
import Bacon from 'baconjs';
const emailRegexp = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/

const emailB = new Bacon.Bus()
const apiResponseB = new Bacon.Bus()


const emailDebounced = emailB.debounce(800)
const erroneousEmailB = emailDebounced
  .filter(email => !email.match(emailRegexp))
  .map(email => <div style={{color:'red'}}>Erroneous email</div>)

const validatingEmailB = emailDebounced
  .filter(email => email.match(emailRegexp))
  .filter(e => fetch(`http://localhost:3001/check/${e}`)
    .then(res => res.json())
    .then(res => apiResponseB.push(res))
  )
  .map(email => <div>Validating email...</div>)

const emailValidatedB = apiResponseB
  .map(res => res
    ? <div>Good email!</div>
    : <div style={{color:'red'}}>Please use the same email account as in your membership application to TRIP!</div>
  )

const state = erroneousEmailB.merge(validatingEmailB).merge(emailValidatedB)

const RegistrationForm = () => 
      <div>
        <div>Register a new user:</div>
        <form>
          <label>
            Email:
            <input type="text"
              onChange={event => emailB.push(event.target.value)}
            />
            <div>{state}</div>
          </label>
          <label>
            Password:
            <input type="password"
            />
          </label>
          <input type="submit" value="submit" />
        </form>
      </div>

export default RegistrationForm;

