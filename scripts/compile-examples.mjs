import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = __dirname + '/../examples';
const destPath = __dirname + '/../examples/services/examples.ts';
const header = "/** Don't edit this file! It was generated automaticaly */";

// --
const isExample = name => name.match(/\.example\.ts$/);

const getExampleKey = fileName => {
  const matchings = fileName.match(/(\w+)\.example$/i);
  return matchings?.[1];
};

const getExampleClass = exampleContent => {
  const matchings = exampleContent.match(
    /class\s+(\w+)\s+implements\s+ExampleInterface/
  );
  return matchings?.[1];
};

const readdirRecursive = root =>
  fs
    .readdirSync(path.normalize(root), {
      withFileTypes: true,
    })
    .reduce((acc, curr) => {
      if (curr.isFile() && isExample(curr.name)) {
        acc = [...acc, root + '/' + curr.name];
      } else if (curr.isDirectory()) {
        acc = [...acc, ...readdirRecursive(root + '/' + curr.name)];
      }
      return acc;
    }, []);

const compile = input => {
  const packs = [];
  const files = readdirRecursive(input);

  for (let file of files) {
    const fileName = path.parse(file).name;
    const key = getExampleKey(fileName);
    const content = fs.readFileSync(file).toString();
    const className = getExampleClass(content);
    packs.push({ fileName, key, content, className, filePath: file });
  }

  return packs;
};

const assembly = (packs, output) => {
  let statements = [];
  for (const pack of packs) {
    statements.push(
      `${pack.key}: () => import('../${pack.fileName}').then((e) => e['${pack.className}'])`
    );
  }

  const contents = `${header}\nexport default {\n\t${statements.join(
    ',\n\t'
  )}\n}\n`;
  fs.writeFileSync(output, contents, { flag: 'w' });
  console.log('\x1b[32m✔ \x1b[37m %s \x1b[0m', path.normalize(output));
};

const build = (input, output) => {
  const packs = compile(input);
  assembly(packs, output);
};

build(srcDir, destPath);
