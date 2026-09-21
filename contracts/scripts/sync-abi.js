import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('artifacts/src/LiveCryptoRouter.sol/LiveCryptoRouter.json');
const destination = resolve('../frontend/src/abi/LiveCryptoRouter.json');
if (!existsSync(source)) throw new Error('Compile the contract before synchronizing its ABI.');
const artifact = JSON.parse(readFileSync(source, 'utf8'));
if (!Array.isArray(artifact.abi)) throw new Error('Compiled artifact does not contain an ABI array.');
writeFileSync(destination, `${JSON.stringify(artifact.abi, null, 2)}\n`);
console.log(`Synchronized ABI to ${destination}`);
