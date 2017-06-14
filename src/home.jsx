import React from 'baret';
import Bacon from 'baconjs';
import { browserHistory } from 'react-router'

const hours = new Bacon.Bus()
const minutes = new Bacon.Bus()
const description = new Bacon.Bus()
const timer = new Bacon.Bus()
const submitted = new Bacon.Bus()

const timerP = timer.toProperty().startWith('begin')

const timerTime = timerP
  .flatMap(status => status === 'running'
    ? Bacon.interval(60000, 1).takeWhile(timerP.map(s => s === 'running'))
    : Bacon.never()
  )

const time = Bacon.update(
  {hours: 0, mins: 0},
  [hours
      .flatMap(s => s !== '' ? parseInt(s, 10) : Bacon.once(''))
      .map(i => i >= 0 ? i : '')
      .toEventStream()
  ], (prev, hours) => ({hours, mins: prev.mins}),
  [minutes
      .flatMap(s => s !== '' ? parseInt(s, 10) : Bacon.once(''))
      .map(i => i >= 0 ? i : '')
      .toEventStream()
  ], (prev, mins) => ({hours: prev.hours, mins}),
  [timerTime.toEventStream()], (prev, totalMins) => ({
    hours: (prev.hours || 0) + Math.floor((totalMins + (prev.mins || 0)) / 60),
    mins: ((prev.mins || 0) + totalMins) % 60
  })
)

const submittable = time.map(currTime =>
  currTime.hours !== '' && currTime.mins !== '' && !!(currTime.hours + currTime.mins))
  .toProperty()
  .and(description
    .map(s => s !== '')
    .toProperty()
  ).startWith(false)

const timerButton = (value, action) => <input type='button' value={value} onClick={e => timer.push(action)}/>
const lockTimeInputs = timerP.map(v => v === 'running')

const validSubmissionP = submittable.and(submitted.toProperty()).filter(v => v)

Bacon.combineWith(
  (valid, time, desc) => Object.assign({}, time, {desc}),
  validSubmissionP,
  time.toProperty(),
  description.toProperty())
.onValue(form => {
  fetch('/api/insert', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify(form),
  })
  .then(res => res.ok ? res.json() : Promise.reject()) 
  .then(() => browserHistory.push('/preview'))
  .catch(console.log)
})

const renderHome = (status) =>
  <div>
    {status.map(s => s.email)}
    <form onSubmit={e => {
      e.preventDefault()
      submitted.push(true)
    }}>
      {
        timerP.decode({
          'begin': timerButton('Start timer', 'running'),
          'running': timerButton('Stop timer', 'paused'),
          'paused': timerButton('Resume timer', 'running')
        })
      }
      <br/>
      <label>
        Hours:
        <input
          id='working-hours'
          type='number'
          step='1'
          min='0'
          value={time.map('.hours')}
          onChange={e => hours.push(e.target.value)}
          disabled={lockTimeInputs}
        />
      </label>
      <label>
        Minutes:
        <input
          id='working-minutes'
          type='number'
          step='15'
          min='0'
          max='59'
          value={time.map('.mins')}
          onChange={e => minutes.push(e.target.value)}
          disabled={lockTimeInputs}
        />
      </label><br/>
      <label>
        Description of work:
        <textarea onChange={e => description.push(e.target.value)}/>
      </label><br/>
      <input id='submit' type='submit' value='submit' disabled={submittable.not()}/>
    </form>
  </div>

const Home = () => {
const status = Bacon.fromPromise(fetch('/api/home', {credentials: 'same-origin'})
  .then(res => res.ok
    ? res.json()
    : browserHistory.push('/login')
  )
)
return renderHome(status)
}

export default Home;

