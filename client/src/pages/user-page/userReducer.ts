import { Action } from '../../rxjs-as-redux/RxStore';

const userReducer = (state: any, action: Action) =>
  ({
    GITHUB_FOLLOWERS_LOADING: {
      ...state,
      isLoading: true
    },
    GITHUB_FOLLOWERS_LOADED: {
      ...state,
      isLoading: false,
      users: action.payload
    },
    NAME_CHANGED: {
      ...state,
      isLoading: false,
      name: action.payload
    }
  }[action.type] || state);

export default userReducer;
