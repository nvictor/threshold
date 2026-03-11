import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const distDir = join(projectRoot, 'dist');
const filesToCopy = ['index.html', 'styles.css', 'manifest.webmanifest', 'sw.js'];

async function main() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  for (const file of filesToCopy) {
    await cp(join(projectRoot, file), join(distDir, file));
  }

  await cp(join(projectRoot, 'src'), join(distDir, 'src'), { recursive: true });
  await cp(join(projectRoot, 'icons'), join(distDir, 'icons'), { recursive: true });

  console.log('PWA generated in', distDir);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
