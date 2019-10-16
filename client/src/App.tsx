import React from 'react';
import './App.css';
import HelloWorldPage from './pages/HelloWorldPage';
import UserPage from './pages/user-page/UserPage';
import flags from './config/flags.json';
import { BrowserRouter as Router, Switch, Route, NavLink } from 'react-router-dom';

const NavBar = () => (
  <div className="navbar">
    <ul>
      {flags['helloWorldPage'] && (
        <li>
          <NavLink exact to="/" activeClassName="selected">
            Home
          </NavLink>
        </li>
      )}
      {flags['usersPage'] && (
        <li>
          <NavLink to="/users" activeClassName="selected">
            Users
          </NavLink>
        </li>
      )}
    </ul>
  </div>
);

const App = () => (
  <Router>
    <div className="grid-container">
      <NavBar />
      <div className="page">
        <Switch>
          {flags['helloWorldPage'] && (
            <Route exact path="/">
              <HelloWorldPage />
            </Route>
          )}
          {flags['usersPage'] && (
            <Route path="/users">
              <UserPage />
            </Route>
          )}
        </Switch>
      </div>
    </div>
  </Router>
);

export default App;
