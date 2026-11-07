// The React Native Firebase Auth entrypoint exposes this API at runtime.
// The browser-oriented TypeScript resolution misses it in some workspace builds.
import type {Persistence} from "firebase/auth";
declare module "firebase/auth" {
  export function getReactNativePersistence(storage: {
    getItem(key:string):Promise<string|null>;
    setItem(key:string,value:string):Promise<void>;
    removeItem(key:string):Promise<void>;
  }):Persistence;
}
