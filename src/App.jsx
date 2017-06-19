import React from 'baret';
import Bacon from 'baconjs';
import { Router, Route, Redirect, browserHistory } from 'react-router';
import styles from './App.css'

import RegistrationForm from './registration-form'
import Home from './home'
import Login from './login'
import Preview from './preview'

const Root = () =>
  <Router history={browserHistory}>
    <Redirect from='/' to='/home' /> 
    <Route path='/register' component={RegistrationForm} />
    <Route path='/home' component={Home} />
    <Route path='/login' component={Login} />
    <Route path='/preview' component={Preview} />
  </Router>


export default Root
