import { mkdirSync, copyFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

/**
 * ディレクトリを再帰的にコピーする
 */
function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export async function initProject(name) {
  const projectDir = resolve(process.cwd(), name);

  console.log(chalk.green.bold('\n🎨 p5studio init'));
  console.log(chalk.white(`  プロジェクト: ${chalk.cyan(name)}`));
  console.log(chalk.white(`  場所:         ${chalk.cyan(projectDir)}\n`));

  if (existsSync(projectDir)) {
    console.error(chalk.red(`エラー: ディレクトリが既に存在します: ${projectDir}`));
    process.exit(1);
  }

  const spinner = ora('プロジェクトを作成中...').start();

  try {
    // テンプレートをコピー
    copyDir(TEMPLATES_DIR, projectDir);

    // .gitignore を作成
    const gitignore = [
      '# p5studio',
      'out/',
      'node_modules/',
      '.DS_Store',
      '',
    ].join('\n');
    writeFileSync(join(projectDir, '.gitignore'), gitignore);

    // プロジェクト用 package.json を作成
    const pkg = {
      name,
      version: '0.1.0',
      description: 'p5studio generative art project',
      private: true,
      scripts: {
        dev: 'npx p5studio dev sketches/example.js',
        render: 'npx p5studio render sketches/example.js',
      },
    };
    writeFileSync(
      join(projectDir, 'package.json'),
      JSON.stringify(pkg, null, 2) + '\n'
    );

    spinner.succeed('プロジェクト作成完了！');

    console.log(chalk.green.bold('\n✅ セットアップ完了'));
    console.log(chalk.white('\n次のコマンドで始めましょう:\n'));
    console.log(chalk.cyan(`  cd ${name}`));
    console.log(chalk.cyan('  npx p5studio dev sketches/example.js'));
    console.log(chalk.gray('\n  または Claude Code でスケッチを生成:'));
    console.log(chalk.cyan('  /new-sketch perlin-flow パーリンノイズの流れるアニメーション\n'));
  } catch (err) {
    spinner.fail('プロジェクト作成失敗');
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}
