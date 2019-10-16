import { ajax } from 'rxjs/ajax';
import { map } from 'rxjs/operators';
import { userStore } from '../../rxjs-as-redux/storeInstances';
import { ActionFn, ResolvableActionFn } from '../../rxjs-as-redux/RxStore';

export const loadGithubFollowers: ResolvableActionFn = userStore.actionCreator(username => {
  const url = `https://api.github.com/users/${username}/followers`;
  return {
    type: 'GITHUB_FOLLOWERS_LOADING',
    payload: ajax(url).pipe(
      map(({ response }) => response.map(s => s.login)),
      map(followers => ({
        type: 'GITHUB_FOLLOWERS_LOADED',
        payload: followers
      }))
    )
  };
});
export const changeName: ActionFn = userStore.actionCreator((userName: string) => ({
  type: 'NAME_CHANGED',
  payload: userName
}));
