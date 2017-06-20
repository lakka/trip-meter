import React from 'baret';
import Bacon from 'baconjs';
import { browserHistory } from 'react-router'
import Header from './header'

const submitBus = new Bacon.Bus()


const render = (status, confirmationStatus) =>
  <div>
    <Header/>
    <table>
      <tr><td>Working time</td><td>{status.map('.hours')}h {status.map('.mins')}min</td></tr>
      <tr><td>Description of work</td><td>{status.map('.desc')}</td></tr>
      <tr><td>Submitted on</td><td>{status.map('.submitted_on')}</td></tr>
    </table>
    <input type='submit' id='confirm-button' value='confirm' onClick={() => submitBus.push(true)} hidden={confirmationStatus.map(s => s === 'success')} /> 
    {confirmationStatus.decode({
      'success': <div>Working hours confirmed successfully!</div>,
      'fail': <div>Server error! Please try again later.</div>
    })}
  </div>

const Preview = () => {
  const status = Bacon.fromPromise(fetch(`/api/preview`, {credentials: 'same-origin'})
    .then(res => res.ok
      ? res.json()
      : browserHistory.push('/login')
    )
  )

  const confirmationStatus = Bacon.when([status, submitBus], status => status.working_hours_id)
    .flatMap(id => 
      Bacon.fromPromise(fetch(`/api/confirm/${id}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
      })
      .then(res => res.ok
        ? Promise.resolve('success')
        : Promise.reject()
      )
      .catch(() => 'fail')
      )
  ).toProperty().startWith('begin')

  return render(status, confirmationStatus)
}

export default Preview;
