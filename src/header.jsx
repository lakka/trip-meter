import React from 'baret';
import Bacon from 'baconjs';
import { Link, browserHistory } from 'react-router'

const logout = new Bacon.Bus()

logout.flatMap(() => Bacon.fromPromise(fetch('/api/logout', {credentials: 'same-origin'})))
.onValue(() => browserHistory.push('/login'))

const Header = () => {
const status = Bacon.fromPromise(fetch('/api/session', {credentials: 'same-origin'})
  .then(res => res.ok
    ? res.json()
    : browserHistory.push('/login')
  )
)
return (
  <div>
    <div style={{float:'left'}}>{status.map('.email')}</div>
    <div style={{float:'right'}}><a href='#' onClick={() => logout.push(true)}>Logout</a></div>
    <br/>
  </div>
  )
}

export default Header;

