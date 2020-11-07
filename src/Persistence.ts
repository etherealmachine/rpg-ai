import { Dispatch, SetStateAction, useState } from "react";

function isObject(i: any) {
  return (i && typeof i === 'object' && !Array.isArray(i));
}

function inflate(target: any, ...objs: any[]): any {
  if (!objs.length) return target;
  const obj = objs.shift();
  if (isObject(target) && isObject(obj)) {
    for (const key in obj) {
      if (isObject(obj[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        inflate(target[key], obj[key]);
      } else if (!Object.isFrozen(target)) {
        Object.assign(target, { [key]: obj[key] });
      }
    }
  }
  return inflate(target, ...objs);
}

export function useLocalStorageState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const fromLocalStorage = window.localStorage.getItem(key);
  if (fromLocalStorage !== null) inflate(initial, JSON.parse(fromLocalStorage));
  const [state, setState] = useState<T>(initial);
  return [state, (newState: any) => {
    window.localStorage.setItem(key, JSON.stringify(newState));
    setState(newState);
  }];
}