const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const chokidar = require('chokidar');
const yargs = require('yargs');

const ANTD = 'antd';
const cwd = path.resolve(__dirname, '..');
const argv = yargs.options({
  dest: { type: 'string', alias: 'd' }, // can be specified without arg key
  skipBuild: { type: 'boolean', alias: 's' },
  ignore: { type: 'string', alias: 'i', default: ['node_modules', '.git'] },
  watch: { type: 'boolean', alias: 'w' },
  verbose: { type: 'boolean', alias: 'v' },
}).argv;

const dest = argv._[0] || argv.dest;
if (!dest.length) throw new Error(chalk.red(`'dest' option is required`));
console.log(chalk.cyan(`🚀  '${dest}'`));

copy(dest, argv);

async function copy(dest, argv) {
  if (argv.skipBuild) {
    console.log(chalk.cyan('🎁  Using existing local Antd build'));
  } else {
    console.log(chalk.cyan('📦  Generating build...'));
    execSync('npm run build', { stdio: 'inherit' });
  }

  const srcDir = cwd;

  const srcDir1 = path.join(cwd, 'es');
  const destDir1 = path.join(dest, 'node_modules', ANTD, 'es');

  const srcDir2 = path.join(cwd, 'lib');
  const destDir2 = path.join(dest, 'node_modules', ANTD, 'lib');

  const srcDir3 = path.join(cwd, 'dist');
  const destDir3 = path.join(dest, 'node_modules', ANTD, 'dist');

  const destDir = path.join(dest, 'node_modules', ANTD);
  await fs.ensureDir(destDir);
  await fs.copy(srcDir1, destDir1);
  await fs.copy(srcDir2, destDir2);
  await fs.copy(srcDir3, destDir3);

  console.log(chalk.green('✨  Finished linking Antd  ✨'));

  if (!argv.watch) return;
  console.log(chalk.cyan('👀  Watching for changes...'));
  chokidar
    .watch(path.join(cwd, 'components'), { ignored: ['es/', 'lib/', 'dist/'] })
    .on('change', async (edit) => {
      let filename;
      try {
        filename = path.relative(srcDir, edit);
        console.log(chalk.cyan('🔄  Rebuilding Antd...'));
        execSync('npm run build', { stdio: 'inherit' });
        await fs.copy(srcDir1, destDir1);
        await fs.copy(srcDir2, destDir2);
        await fs.copy(srcDir3, destDir3);
        console.log(chalk.cyan('✅  Rebuilt & relinked Antd'));
      } catch (error) {
        console.error(chalk.red(error, filename));
      }
    });
}
