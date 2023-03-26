import type {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'batis';

export interface Hooks {
  useCallback: typeof useCallback;
  useEffect: typeof useEffect;
  useLayoutEffect: typeof useLayoutEffect;
  useMemo: typeof useMemo;
  useReducer: typeof useReducer;
  useRef: typeof useRef;
  useState: typeof useState;
}
