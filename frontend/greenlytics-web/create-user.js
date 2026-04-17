import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

// ======================================================
// CONFIG
// ======================================================

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const USER_INPUT = {
  clientCode: 'CLIENT-001',
  roleCode: 'admin',
  code: 'USER-001',
  name: 'CarlesAdmin',
  email: 'carlespegu@gmail.com',
  password: process.env.CREATE_USER_PASSWORD ?? '',
  isActive: true,
};

// ======================================================
// HELPERS
// ======================================================

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Falta la variable d'entorn ${name}`);
  }
}

async function getSingleOrThrow(queryPromise, notFoundMessage) {
  const { data, error } = await queryPromise;
  if (error) throw error;
  if (!data) throw new Error(notFoundMessage);
  return data;
}

// ======================================================
// MAIN
// ======================================================

async function main() {
  requireEnv('SUPABASE_URL', SUPABASE_URL);
  requireEnv('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log('Generant hash de password...');
  const passwordHash = await bcrypt.hash(USER_INPUT.password, 10);

  console.log('Buscant client...');
  const client = await getSingleOrThrow(
    supabase
      .from('clients')
      .select('id, code, name')
      .eq('code', USER_INPUT.clientCode)
      .eq('is_deleted', false)
      .maybeSingle(),
    `No s'ha trobat cap client amb code=${USER_INPUT.clientCode}`
  );

  console.log('Buscant role...');
  const role = await getSingleOrThrow(
    supabase
      .from('roles')
      .select('id, code, name')
      .eq('code', USER_INPUT.roleCode)
      .eq('is_deleted', false)
      .maybeSingle(),
    `No s'ha trobat cap role amb code=${USER_INPUT.roleCode}`
  );

  console.log('Comprovant si l’usuari ja existeix...');
  const { data: existingUser, error: existingUserError } = await supabase
    .from('users')
    .select('id, email, code')
    .eq('email', USER_INPUT.email)
    .eq('is_deleted', false)
    .maybeSingle();

  if (existingUserError) {
    throw existingUserError;
  }

  if (existingUser) {
    console.log('Ja existeix un usuari amb aquest email:');
    console.log(existingUser);
    return;
  }

  const payload = {
    client_id: client.id,
    role_id: role.id,
    code: USER_INPUT.code,
    name: USER_INPUT.name,
    email: USER_INPUT.email,
    password_hash: passwordHash,
    external_auth_id: null,
    is_active: USER_INPUT.isActive,
    is_deleted: false,
    created_at: new Date().toISOString(),
    created_by_user_id: null,
    updated_at: null,
    updated_by_user_id: null,
    deleted_at: null,
    deleted_by_user_id: null,
  };

  console.log('Creant usuari...');
  const { data: createdUser, error: insertError } = await supabase
    .from('users')
    .insert(payload)
    .select('id, code, name, email, client_id, role_id, is_active, created_at')
    .single();

  if (insertError) {
    throw insertError;
  }

  console.log('Usuari creat correctament:');
  console.log(JSON.stringify(createdUser, null, 2));
}

main().catch((error) => {
  console.error('Error creant l’usuari:');
  console.error(error);
  process.exit(1);
});
