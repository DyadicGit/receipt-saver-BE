import React from 'react';
import { changeName, loadGithubFollowers } from './actions';
import { StateContext } from '../../rxjs-as-redux/storeInstances';

const handleChangeName = (name: string) => () => changeName(name);

const userList = users => {
  if (!users || !users.length) return;
  return (
    <ul style={{ height: '50vh', overflowY: 'auto' }}>
      {users.map((user, index) => (
        <li key={index}>{user}</li>
      ))}
    </ul>
  );
};

const UserPage = () => (
  <StateContext.Consumer>
    {({ isLoading, name, users }) => (
      <>
        {isLoading ? <p>Loading...</p> : <h1>{name}</h1>}
        {userList(users)}
        <button onClick={handleChangeName('Harry')}>Harry</button>
        <button onClick={handleChangeName('Sally')}>Sally</button>
        <br />
        <button onClick={() => loadGithubFollowers('ryardley')}>Load Followers</button>
      </>
    )}
  </StateContext.Consumer>
);
export default UserPage;
