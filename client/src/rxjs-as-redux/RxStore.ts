import { from, isObservable, Observable, Subject } from 'rxjs';
import { flatMap, scan, startWith } from 'rxjs/operators';

export type Action = {
  type: string;
  payload: any;
};
export type ActionFn = (any) => Action;
export type ResolvableAction = {
  type: string;
  payload: Observable<Action>;
};
export type ResolvableActionFn = (any) => ResolvableAction;

export const createStore = (initState, reducer) => {
  const action$ = new Subject();
  return {
    store$: action$.pipe(
      flatMap(action => (isObservable(action) ? action : from([action]))),
      startWith(initState),
      scan(reducer)
    ),
    actionCreator: func => (...args) => {
      const action: Action = func(...args);
      action$.next(action);
      if (isObservable(action.payload)) action$.next(action.payload);
      return action;
    }
  };
};
