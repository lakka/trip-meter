import React from 'baret';
import Bacon from 'baconjs';
import { browserHistory } from 'react-router'

const renderHome = (status) =>
  <div>
  {status.map(s => s.email)}
  </div>

const Home = () => {
const status = Bacon.fromPromise(fetch('/api/home', {credentials: 'include'})
  .then(res => res.ok
    ? res.json()
    : browserHistory.push('/login')
  )
)
return renderHome(status)
}

export default Home;

