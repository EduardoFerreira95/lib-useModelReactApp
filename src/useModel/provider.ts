import path from 'path';
import fs from 'fs';
import getModelsPath from './getProviderContent';
import getUseModelContent from './getUseModelContent';

const filesPath = path.resolve(__dirname, '..', 'modules');

const modelsPath = getModelsPath(filesPath);

const buildPath = path.resolve(__dirname, '..', 'plugin-model');

fs.mkdirSync(buildPath);

fs.appendFile(path.resolve(buildPath, 'Provider.tsx'), modelsPath, function (err) {
  if (err) throw err;
  console.log('Saved!');
});

fs.appendFile(path.resolve(buildPath, 'hook.tsx'), getUseModelContent(), function (err) {
  if (err) throw err;
  console.log('Saved!');
});
