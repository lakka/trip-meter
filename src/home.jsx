import React from 'baret';
import Bacon from 'baconjs';
import { browserHistory } from 'react-router'
import Header from './header'
import './styles/app.css'


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

const timerButton = (value, action) => <input className='centeredButton' type='button' value={value} onClick={e => timer.push(action)}/>
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
  .then(res => res.ok ? browserHistory.push('/preview') : Promise.reject()) 
  .catch(console.log)
})

const Home = () =>
  <div>
    <Header/>
    <div className='content'>
      <form onSubmit={e => {
        e.preventDefault()
        submitted.push(true)
      }}>
        {
          timerP.decode({
            'begin': timerButton('start timer', 'running'),
            'running': timerButton('stop timer', 'paused'),
            'paused': timerButton('resume timer', 'running')
          })
        }
        <br/>
        <div className='timeInputs'>
          <label>
            Hours:&nbsp;
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
            Minutes:&nbsp;
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
          </label>
        </div>
        <label className='description'>
          Description of work:<br/>
          <textarea onChange={e => description.push(e.target.value)}/>
        </label><br/>
        <input id='submit' className='centeredButton' type='submit' value='submit' disabled={submittable.not()}/>
      </form>
    </div>
  </div>

export default Home;

