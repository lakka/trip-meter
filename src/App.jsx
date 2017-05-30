import React from 'baret';
import Bacon from 'baconjs';
import { Router, Route, browserHistory } from 'react-router';
import styles from './App.css'

import RegistrationForm from './registration-form'
import Home from './home'

const Root = () =>
  <Router history={browserHistory}>
    <Route path='/register' component={RegistrationForm} />
    <Route path='/home' component={Home} />
  </Router>


export default Root
