import path from 'path';
import fs from 'fs';
import getModelsPath from './getProviderContent';

const filesPath = path.resolve(__dirname, '..', 'modules');

const modelsPath = getModelsPath(filesPath);

const buildPath = path.resolve(__dirname, '..', 'plugin-model');

fs.mkdirSync(buildPath);

fs.appendFile(path.resolve(buildPath, 'index.tsx'), modelsPath, function (err) {
  if (err) throw err;
  console.log('Saved!');
});
