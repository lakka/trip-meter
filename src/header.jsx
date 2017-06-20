import React from 'baret';
import Bacon from 'baconjs';
import { Link, browserHistory } from 'react-router'

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
    <div style={{float:'right'}}><Link to="/logout">Logout</Link></div>
    <br/>
  </div>
  )
}

export default Header;

