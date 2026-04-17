import bcrypt from 'bcrypt';

const password = process.env.GENERATE_HASH_PASSWORD ?? '';
const hash = await bcrypt.hash(password, 10);

console.log('HASH:', hash);
