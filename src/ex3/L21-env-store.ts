import { add, isEmpty, map, reduce, zipWith } from 'ramda'
import { Value } from './L21-value-store'
import { Result, makeFailure, makeOk, bind, either } from '../shared/result'

// ========================================================
// Box datatype
// Encapsulate mutation in a single type.
type Box<T> = T[]
const makeBox = <T>(x: T): Box<T> => [x]
const unbox = <T>(b: Box<T>): T => b[0]
const setBox = <T>(b: Box<T>, v: T): void => {
  b[0] = v
  return
}

// ========================================================
// Store datatype
export interface Store {
  tag: 'Store'
  vals: Box<Box<Value>[]>
}

export const isStore = (x: any): x is Store => x.tag === 'Store'
export const makeEmptyStore = (): Store => ({ tag: 'Store', vals: makeBox([]) })
export const theStore: Store = makeEmptyStore();

export const extendStore = (s: Store, val: Value): Store => {
  const valsUnboxed = unbox(s.vals);
  s.vals = isEmpty(valsUnboxed) ? makeBox(makeBox([val])) : makeBox(valsUnboxed.concat(makeBox([val])));
  return s;
}

export const applyStore = (store: Store, address: number): Result<Value> => 
  unbox(store.vals).length >= address
  ? makeOk(unbox(unbox(store.vals)[address]))
  : makeFailure('address is illegal')



export const setStore = (store: Store, address: number, val: Value): void => 
  setBox(unbox(store.vals)[address], val);
  

// ========================================================
// Environment data type
// export type Env = EmptyEnv | ExtEnv;
export type Env = GlobalEnv | ExtEnv

interface GlobalEnv {
  tag: 'GlobalEnv'
  vars: Box<string[]>
  addresses: Box<number[]>
}

export interface ExtEnv {
  tag: 'ExtEnv'
  vars: string[]
  addresses: number[]
  nextEnv: Env
}

const makeGlobalEnv = (): GlobalEnv => ({
  tag: 'GlobalEnv',
  vars: makeBox([]),
  addresses: makeBox([]),
})

export const isGlobalEnv = (x: any): x is GlobalEnv => x.tag === 'GlobalEnv'

// There is a single mutable value in the type Global-env
export const theGlobalEnv = makeGlobalEnv()

export const makeExtEnv = (vs: string[], addresses: number[], env: Env): ExtEnv => ({
  tag: 'ExtEnv',
  vars: vs,
  addresses: addresses,
  nextEnv: env,
})

const isExtEnv = (x: any): x is ExtEnv => x.tag === 'ExtEnv'

export const isEnv = (x: any): x is Env => isGlobalEnv(x) || isExtEnv(x)

// Apply-env
export const applyEnv = (env: Env, v: string): Result<number> => 
  isGlobalEnv(env) ? applyGlobalEnv(env, v) : applyExtEnv(env, v)

/* 
purpose: Finds the address of a given value IN GE. 
returns: Result of address.  
*/
const applyGlobalEnv = (env: GlobalEnv, v: string): Result<number> => 
  unbox(env.vars).includes(v) ? makeOk(unbox(env.addresses)[unbox(env.vars).indexOf(v)]) : makeFailure("value doesn't exist");


/* 
purpose: Adds a given value to the given address - IN GE. Doesn't affect the store.
returns: void.  
*/
export const globalEnvAddBinding = (v: string, addr: number): void => {
  setBox(theGlobalEnv.addresses, unbox(theGlobalEnv.addresses).concat(addr))
  setBox(theGlobalEnv.vars, unbox(theGlobalEnv.vars).concat(v))
}

/* 
purpose: Finds the address of a given value IN A GIVEN EXT-ENV. If the value wasn't found, searching in the next env. 
returns: Result of address.  
*/
const applyExtEnv = (env: ExtEnv, v: string): Result<number> =>
  env.vars.includes(v) ? makeOk(env.addresses[env.vars.indexOf(v)]) : applyEnv(env.nextEnv, v)

  
export const applyEnvStore = (env: Env, v: string): Result<number> =>
  isGlobalEnv(env) ? applyGlobalEnvStore(env, v) :
  isExtEnv(env) ? applyExtEnvStore(env, v) :
  env;


const applyGlobalEnvStore = (ge: GlobalEnv, v: string): Result<number> =>
  bind(applyGlobalEnv(ge, v), (address: number) => makeOk(address));

const applyExtEnvStore = (env: ExtEnv, v: string): Result<number> =>
  bind(applyExtEnv(env, v),  (address: number) => makeOk(address));

