import bcrypt from 'bcrypt';
import crypto from 'crypto';

const rawSecret = `GL_DEV_${crypto.randomBytes(24).toString('base64url')}`;
const hash = await bcrypt.hash(rawSecret, 10);

console.log('RAW SECRET:');
console.log(rawSecret);
console.log('');
console.log('HASH:');
console.log(hash);