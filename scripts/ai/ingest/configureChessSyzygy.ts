import { existsSync } from 'node:fs';

const path = process.env.LOCAL_SYZYGY_PATH || process.argv[2] || '';
if (!path || !existsSync(path)) {
  console.log(JSON.stringify({ enabled: false, reason: 'Set LOCAL_SYZYGY_PATH to a local Syzygy folder.' }, null, 2));
} else {
  console.log(JSON.stringify({ enabled: true, localPath: path, maxPieces: 7, redistribution: 'not included in repository' }, null, 2));
}

