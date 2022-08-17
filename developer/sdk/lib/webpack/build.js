'use strict';

const { say } = require('cfonts');
const chalk = require('chalk');
const fse = require('fs-extra');
const path = require('path');
const webpack = require('webpack');
const Multispinner = require('multispinner');

function greeting() {
  const isCI = process.env.CI || false;
  const cols = process.stdout.columns;
  let text = '';

  if (cols > 85) text = 'kungfu-build';
  else if (cols > 60) text = 'kungfu-|build';
  else text = false;

  if (text && !isCI) {
    say(text, {
      colors: ['yellow'],
      font: 'simple3d',
      space: false,
    });
  } else console.log(chalk.yellow.bold('\n  kungfu-build'));
}

const pack = (config) =>
  new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) {
        reject(err.stack || err);
      } else if (stats.hasErrors()) {
        let err = '';

        stats
          .toString({
            chunks: false,
            colors: true,
          })
          .split(/\r?\n/)
          .forEach((line) => {
            err += `    ${line}\n`;
          });

        reject(err);
      } else {
        resolve(
          stats.toString({
            chunks: false,
            colors: true,
          }),
        );
      }
    });
  });

const run = (distDir, distName = 'sdk') => {
  fse.rmSync(distDir, { recursive: true });
  greeting();

  return new Promise((resolve, reject) => {
    const argv = {
      mode: 'production',
      distDir: distDir,
      distName: distName,
    };

    const config = require('./webpack.config');

    const errorLog = chalk.bgRed.white(' ERROR ') + ' ';
    const okayLog = chalk.bgBlue.white(' OKAY ') + ' ';

    const tasks = ['kfs'];
    const spinner = new Multispinner(tasks, {
      preText: 'building',
      postText: 'process',
      interval: process.env.GITHUB_ACTIONS ? 60000 : 100,
    });

    let results = '';

    spinner.on('success', () => {
      process.stdout.write('\x1B[2J\x1B[0f');
      console.log(`\n\n${results}`);
      console.log(`${okayLog}webpack ${chalk.yellow('`done`')}\n`);
      resolve();
    });

    spinner.on('error', reject);

    pack(config(argv))
      .then((result) => {
        results += result + '\n\n';
        spinner.success('kfs');
      })
      .catch((err) => {
        spinner.error('kfs');
        console.log(`\n  ${errorLog}failed to build kfs process`);
        console.error(`\n${err}\n`);
        process.exit(1);
      });
  });
};

module.exports = run;

if (require.main === module) {
  const distDir = path.join(process.cwd().toString(), 'dist');
  fse.ensureDirSync(distDir);
  run(distDir).catch(console.error);
}