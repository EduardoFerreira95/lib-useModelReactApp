
import globby from 'globby';
import { readFileSync } from 'fs';
import { EOL } from 'os';
import  { parse } from '@babel/parser';
import  traverse from '@babel/traverse';
import path from 'path';
import { Identifier, ArrowFunctionExpression } from '@babel/types';
import { IHookDTO } from '../typing/IHookDTO';
import { ModelItemType } from '../typing/ModelItemType';

export const getPath = (absPath: string) => {
  const info = path.parse(absPath);
  return winPath(path.join(info.dir, info.name).replace(/'/, "'"));
};

function winPath(filePath: string) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(filePath);
  if (isExtendedLengthPath) {
    return filePath;
  }

  return filePath.replace(/\\/g, '/');
}

export function getFiles(cwd: string) {
 return globby
   .sync('./**/*.{ts,tsx}', {
     cwd,
   })
   .filter(
     (file) =>
       !file.endsWith('.d.ts') &&
       !file.endsWith('.test.js') &&
       !file.endsWith('.test.jsx') &&
       !file.endsWith('.test.ts') &&
       !file.endsWith('.test.tsx') &&
       !file.includes('node_modules'),
   );
}

const sort = (hooksArray: IHookDTO[]) => {
  let hooks: string[] = [];
  hooksArray.forEach((hook, index) => {
    if (hook.use && hook.use.length) {
      const hookGroup = [...hook.use, hook.namespace];

      const cannotUse = [hook.namespace];
      for (let i = 0; i <= index; i += 1) {
        if (hooksArray[i].use.filter(h => cannotUse.includes(h)).length) {
          if (!cannotUse.includes(hooksArray[i].namespace)) {
            cannotUse.push(hooksArray[i].namespace);
            i = -1;
          }
        }
      }

      const errorList = hook.use.filter(h => cannotUse.includes(h));
      if (errorList.length) {
        throw Error(
          `Circular dependencies: ${hook.namespace} can't use ${errorList.join(', ')}`,
        );
      }

      const intersection = hooks.filter(hook => hookGroup.includes(hook));
      if (intersection.length) {
        // first intersection
        const hooksIndex = hooks.indexOf(intersection[0]);
        // replace with groupItem
        hooks = hooks
          .slice(0, hooksIndex)
          .concat(hookGroup)
          .concat(hooks.slice(hooksIndex + 1));
      } else {
        hooks.push(...hookGroup);
      }
    }
    if (!hooks.includes(hook.namespace)) {
      // first occurance append to the end
      hooks.push(hook.namespace);
    }
  });

  return hooks;
};


const getName = (absPath: string) => path.basename( absPath, path.extname(absPath));

const genModels = (imports: string[]) => {

  const contents = imports.map(absPath => ({
    namespace: getName(absPath),
    content: readFileSync(path.resolve(__dirname, '..', 'src', 'modules', absPath)).toString(),
  }));
  const allUserModel = imports.map(getName);

  const checkDuplicates = (list: string[]) => new Set(list).size !== list.length;
  const raw = contents.map((model, index) => {
    const ast = parse(model.content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    const use = [] as any[];
    traverse(ast, {
      enter(astPath) {
        if (astPath.isIdentifier({ name: 'useModel' })) {
          try {
            const ns = (astPath.parentPath.node)[0].value;
            if (allUserModel.includes(ns)) {
              use.push(ns);
            }
          } catch (e) {
            console.log(e)
          }
        }
      },
    });

    return { namespace: model.namespace, use, importName: `model${index}` };
  });

  const models = sort(raw);
  if (checkDuplicates(contents.map(model => model.namespace))) {
    throw Error('Have duplicate module! Please, verify and try again.');
  }

  return raw.sort((modelA, modelB) => models.indexOf(modelA.namespace) - models.indexOf(modelB.namespace));
};


function getModels(files: string[]) {
  const sortedModels = genModels(files);
  return sortedModels
    .map(model => `'${model.namespace.replace(/'/g, "\\'")}': ${model.importName}`)
    .join(', ');
};

getModels(getFiles(path.resolve(__dirname, '..', 'src', 'modules')));

export const isValidHook = (filePath: string) => {
  const ast = parse(readFileSync(filePath, { encoding: 'utf-8' }).toString(), {
    sourceType: "module",
    plugins: ["jsx", "typescript"]
  });
  let valid = false;
  let identifierName = '';
  traverse(ast, {
    enter(p) {
      if (p.isExportDefaultDeclaration()) {
        const { type } = p.node.declaration;
        try {
          if (
            type === 'ArrowFunctionExpression' ||
            type === 'FunctionDeclaration'
          ) {
            valid = true;
          } else if (type === 'Identifier') {
            identifierName = (p.node.declaration as Identifier).name;
          }
        } catch (e) {
          console.error(e);
        };
      }
    }
  });

  try {
    if (identifierName) {
      ast.program.body.forEach(ele => {
        if (ele.type === 'FunctionDeclaration') {
          if (ele.id?.name === identifierName) {
            valid = true;
          }
        }
        if (ele.type === 'VariableDeclaration') {
          if ((ele.declarations[0].id as Identifier).name === identifierName &&
            (ele.declarations[0].init as ArrowFunctionExpression).type === 'ArrowFunctionExpression') {
            valid = true;
          }
        }
      })
    }
  } catch (e) {
    valid = false;
  }

  return valid;
}

export const genExtraModels = (models: ModelItemType[] = []) =>
  models.map(ele => {
    if (typeof ele === 'string') {
      return {
        importPath: getPath(ele),
        importName: getName(ele),
        namespace: getName(ele),
      };
    }
    return {
      importPath: getPath(ele.absPath),
      importName: getName(ele.absPath),
      namespace: ele.namespace,
    };
  });

function getExtraImports(models: ModelItemType[] = []) {
  const extraModels = genExtraModels(models);
  return extraModels
    .map(
      ele =>
        `import ${ele.importName} from '${winPath(
          ele.importPath.replace(/'/g, "\\'"),
        )}';`,
    )
    .join(EOL);
}



function getExtraModels(models: ModelItemType[] = []) {
  const extraModels = genExtraModels(models);
  return extraModels
    .map(ele => `'${ele.namespace}': ${winPath(ele.importName)}`)
    .join(', ');
}

export const genImports = (imports: string[]) =>
  imports
    .map((ele, index) => `import model${index} from "${winPath(getPath(ele))}";`)
    .join(EOL);

export const getValidFiles = (files: string[], modelsDir: string) => files.map(file => {
  const filePath = path.join(modelsDir, file);
  const valid = isValidHook(filePath);

  console.log({ filePath, valid })
  if (valid) {
    return filePath;
  }
  return '';
}).filter(ele => !!ele) as string[];

export default function(modelsDir: string, extra: ModelItemType[] = []) {
  const files = getValidFiles(getFiles(modelsDir), modelsDir);
  const imports = genImports(files);
  const userModels = getModels(files);
  const extraModels = getExtraModels(extra);
  const extraImports = getExtraImports(extra);

  return `import React from 'react';
${extraImports}
${imports}
// @ts-ignore
import Dispatcher from '${winPath(path.join(__dirname, 'helpers', 'dispatcher'))}';
// @ts-ignore
import Executor from '${winPath(path.join(__dirname, 'helpers', 'executor'))}';
// @ts-ignore
import { UmiContext } from '${winPath(path.join(__dirname, 'helpers', 'constant'))}';
export const models = { ${extraModels ?  extraModels + ', '  : ''}${userModels} };
export type Model<T extends keyof typeof models> = {
  [key in keyof typeof models]: ReturnType<typeof models[T]>;
};
export type Models<T extends keyof typeof models> = Model<T>[T]
const dispatcher = new Dispatcher!();
const Exe = Executor!;
export default ({ children }: { children: React.ReactNode }) => {
  return (
    <UmiContext.Provider value={dispatcher}>
      {
        Object.entries(models).map(pair => (
          <Exe key={pair[0]} namespace={pair[0]} hook={pair[1] as any} onUpdate={(val: any) => {
            const [ns] = pair as [keyof typeof models, any];
            dispatcher.data[ns] = val;
            dispatcher.update(ns);
          }} />
        ))
      }
      {children}
    </UmiContext.Provider>
  )
}`
};

