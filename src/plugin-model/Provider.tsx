import React from 'react';

import model0 from "/Users/eduardoferreira/Desktop/testeAPp/init/src/modules/useCounter";
// @ts-ignore
import Dispatcher from '/Users/eduardoferreira/Desktop/testeAPp/init/src/useModel/helpers/dispatcher';
// @ts-ignore
import Executor from '/Users/eduardoferreira/Desktop/testeAPp/init/src/useModel/helpers/executor';
// @ts-ignore
import { UmiContext } from '/Users/eduardoferreira/Desktop/testeAPp/init/src/useModel/helpers/constant';
export const models = { 'useCounter': model0 };
export type Model<T extends keyof typeof models> = {
  [key in keyof typeof models]: ReturnType<typeof models[T]>;
};
export type Models<T extends keyof typeof models> = Model<T>[T]
const dispatcher = new Dispatcher!();
const Exe = Executor!;
export default function Provider ({ children }: { children: React.ReactNode }) {
  return (
    <UmiContext.Provider value={dispatcher}>
      {
        Object.entries(models).map(pair => (
          <Exe key={pair[0]} namespace={pair[0]} hook={pair[1] as any} onUpdate={(val: any) => {
            const [namespace] = pair as [keyof typeof models, any];
            const hook = Object.entries(dispatcher.data).find(data => data === namespace);

            console.log({ hook });
            if (hook) {
              hook[1] = val;
              dispatcher.update(namespace);
            }
            dispatcher.update(namespace);
          }} />
        ))
      }
      {children}
    </UmiContext.Provider>
  )
}
