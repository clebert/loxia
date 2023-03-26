import {
  type useCallback,
  type useEffect,
  type useLayoutEffect,
  type useMemo,
  type useReducer,
  type useRef,
  type useState,
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
