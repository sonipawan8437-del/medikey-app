import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dplqchnemrdckjzmrtrc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Th5qKZynF1gi5OJFU9MUng_YAsdhSmg';

console.log('======================================================================');
console.log('        MediKey Phase 02 Supabase Comprehensive E2E Test Suite        ');
console.log('======================================================================');

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

const DEFAULT_TEST_PASSWORD = process.env.MEDIKEY_TEST_PASSWORD || 'P@ssword2026!SecureMedical';

const user1Creds = {
  email: process.env.MEDIKEY_TEST_USER1_EMAIL || 'synthetic.patient1@medikey.local',
  password: DEFAULT_TEST_PASSWORD,
  id: 'a0000000-0000-0000-0000-000000000001'
};

const user2Creds = {
  email: process.env.MEDIKEY_TEST_USER2_EMAIL || 'synthetic.patient2@medikey.local',
  password: DEFAULT_TEST_PASSWORD,
  id: 'b0000000-0000-0000-0000-000000000002'
};

async function runTestSuite() {
  const summary = {
    tablesChecked: 10,
    testsPassed: 0,
    testsFailed: 0,
    details: []
  };

  function assert(condition, description) {
    if (condition) {
      summary.testsPassed++;
      console.log(`  ✅ PASS: ${description}`);
      summary.details.push({ status: 'PASS', description });
    } else {
      summary.testsFailed++;
      console.log(`  🚨 FAIL: ${description}`);
      summary.details.push({ status: 'FAIL', description });
    }
  }

  // --- Step 1: Verify All 10 Tables Exist & RLS Blocks Anonymous Access ---
  console.log('\n[1/7] Testing Anonymous Access & RLS Table Guards...');
  const tables = [
    'profiles',
    'medical_history',
    'emergency_contacts',
    'medical_documents',
    'prescriptions',
    'health_notes',
    'appointments',
    'medical_kit',
    'emergency_shares',
    'user_settings'
  ];

  for (const table of tables) {
    const { data, error, status } = await anonClient.from(table).select('*').limit(1);
    assert(
      status === 401 || (Array.isArray(data) && data.length === 0),
      `Table [${table}] exists and anon access is guarded by RLS (HTTP status: ${status}, records: ${data ? data.length : 0})`
    );
  }

  // --- Step 2: Authenticate User 1 and User 2 ---
  console.log('\n[2/7] Authenticating Synthetic Users via Supabase Auth...');
  const client1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: auth1, error: errAuth1 } = await client1.auth.signInWithPassword({
    email: user1Creds.email,
    password: user1Creds.password
  });
  assert(!errAuth1 && !!auth1?.session, `User 1 signed in successfully (Token: ${auth1?.session?.access_token ? 'Acquired' : 'Missing'})`);

  const client2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: auth2, error: errAuth2 } = await client2.auth.signInWithPassword({
    email: user2Creds.email,
    password: user2Creds.password
  });
  assert(!errAuth2 && !!auth2?.session, `User 2 signed in successfully (Token: ${auth2?.session?.access_token ? 'Acquired' : 'Missing'})`);

  if (!auth1?.session || !auth2?.session) {
    console.error('Fatal: Cannot continue without authenticated user sessions.');
    process.exit(1);
  }

  // --- Step 3: Verify Automated Profile & Trigger Creation ---
  console.log('\n[3/7] Verifying Automated Trigger Provisioning (Health ID, Profiles, Settings)...');
  const { data: prof1, error: p1Err } = await client1.from('profiles').select('*').eq('id', user1Creds.id).single();
  assert(
    prof1 && prof1.health_id && prof1.health_id.startsWith('MK-'),
    `User 1 profile auto-created with Health ID: ${prof1?.health_id}`
  );

  const { data: prof2 } = await client2.from('profiles').select('*').eq('id', user2Creds.id).single();
  assert(
    prof2 && prof2.health_id && prof2.health_id.startsWith('MK-') && prof2.health_id !== prof1.health_id,
    `User 2 profile auto-created with unique Health ID: ${prof2?.health_id}`
  );

  const { data: settings1 } = await client1.from('user_settings').select('*').eq('user_id', user1Creds.id).single();
  assert(settings1 && settings1.language === 'en', `User 1 default settings auto-provisioned (language=${settings1?.language})`);

  // --- Step 4: Medical Records Full CRUD (Prescriptions, Contacts, Notes, Appointments, Kit) ---
  console.log('\n[4/7] Testing Medical Records CRUD Operations for User 1...');
  
  // Update Profile with critical medical info
  const { error: upProfErr } = await client1.from('profiles').update({
    blood_group: 'B+',
    allergies: 'Penicillin, Tree Nuts',
    chronic_conditions: 'Type 1 Diabetes',
    current_medications: 'Insulin Glargine 20 units'
  }).eq('id', user1Creds.id);
  assert(!upProfErr, `User 1 profile updated with critical health parameters`);

  // CREATE Prescription
  const { data: rx1, error: rxErr } = await client1.from('prescriptions').insert({
    user_id: user1Creds.id,
    medication_name: 'Insulin Glargine',
    dosage: '20 units at bedtime',
    prescribing_doctor: 'Dr. Gregory House',
    frequency: 'Once daily'
  }).select().single();
  assert(!rxErr && rx1?.id, `[CREATE] Prescription created (ID: ${rx1?.id})`);

  // READ Prescription
  const { data: rxList } = await client1.from('prescriptions').select('*').eq('user_id', user1Creds.id);
  assert(rxList && rxList.length >= 1, `[READ] User 1 queried their own prescriptions (${rxList?.length} found)`);

  // UPDATE Prescription
  const { data: rxUpdated, error: rxUpErr } = await client1.from('prescriptions').update({
    dosage: '22 units at bedtime (titrated)'
  }).eq('id', rx1.id).select().single();
  assert(!rxUpErr && rxUpdated?.dosage.includes('titrated'), `[UPDATE] Prescription dosage modified to: ${rxUpdated?.dosage}`);

  // CREATE Emergency Contact
  const { data: contact1, error: ecErr } = await client1.from('emergency_contacts').insert({
    user_id: user1Creds.id,
    name: 'Mark Vance',
    relationship: 'Brother',
    phone: '+1-555-0144',
    is_primary: true
  }).select().single();
  assert(!ecErr && contact1?.id, `[CREATE] Emergency Contact added: ${contact1?.name} (${contact1?.phone})`);

  // CREATE Health Note
  const { data: note1, error: hnErr } = await client1.from('health_notes').insert({
    user_id: user1Creds.id,
    title: 'Fasting Blood Glucose Log',
    note: 'Fasting reading 104 mg/dL. Morning exercise completed.'
  }).select().single();
  assert(!hnErr && note1?.id, `[CREATE] Health Note added: "${note1?.title}"`);

  // CREATE Appointment
  const { data: apt1, error: aptErr } = await client1.from('appointments').insert({
    user_id: user1Creds.id,
    clinic_name: 'Metropolitan Endocrine Clinic',
    appointment_date: '2026-12-20',
    appointment_time: '09:00 AM',
    reason: 'Quarterly HbA1c Review'
  }).select().single();
  assert(!aptErr && apt1?.id, `[CREATE] Appointment scheduled at ${apt1?.clinic_name}`);

  // CREATE Medical Kit Item
  const { data: kit1, error: kitErr } = await client1.from('medical_kit').insert({
    user_id: user1Creds.id,
    item_name: 'Continuous Glucose Monitor Sensor',
    quantity: '2 sensors',
    notes: 'Stored in bedroom medicine cabinet'
  }).select().single();
  assert(!kitErr && kit1?.id, `[CREATE] Medical Kit item added: ${kit1?.item_name}`);

  // --- Step 5: Strict Cross-Tenant RLS Data Isolation ---
  console.log('\n[5/7] Testing Strict Cross-Tenant RLS Data Isolation (Zero Leaks)...');

  // User 2 tries to read User 1's profile
  const { data: u2ReadProf } = await client2.from('profiles').select('*').eq('id', user1Creds.id);
  assert(!u2ReadProf || u2ReadProf.length === 0, `RLS Guard: User 2 cannot read User 1 profile (0 records returned)`);

  // User 2 tries to read User 1's prescription
  const { data: u2ReadRx } = await client2.from('prescriptions').select('*').eq('id', rx1.id);
  assert(!u2ReadRx || u2ReadRx.length === 0, `RLS Guard: User 2 cannot read User 1 prescription (0 records returned)`);

  // User 2 tries to update User 1's prescription
  const { data: u2TamperRx } = await client2.from('prescriptions').update({ dosage: 'MALICIOUS_OVERWRITE' }).eq('id', rx1.id).select();
  assert(!u2TamperRx || u2TamperRx.length === 0, `RLS Guard: User 2 cannot modify User 1 prescription (0 rows affected)`);

  // User 2 tries to delete User 1's emergency contact
  const { data: u2DeleteEc } = await client2.from('emergency_contacts').delete().eq('id', contact1.id).select();
  assert(!u2DeleteEc || u2DeleteEc.length === 0, `RLS Guard: User 2 cannot delete User 1 emergency contact (0 rows deleted)`);

  // --- Step 6: Private Storage Buckets & Storage RLS ---
  console.log('\n[6/7] Testing Private Storage Buckets, Uploads, Signed URLs & Storage RLS...');

  // User 1 uploads document
  const testDocBuffer = Buffer.from('%PDF-1.4 Simulated Confidential Diagnostic Lab Report\nPatient: Eleanor Vance\nTest: HbA1c = 6.2%');
  const u1DocPath = `${user1Creds.id}/medical/hba1c_lab_report.pdf`;

  const { data: upDoc, error: upDocErr } = await client1.storage
    .from('medikey-documents')
    .upload(u1DocPath, testDocBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });
  assert(!upDocErr && upDoc?.path, `User 1 uploaded private document to medikey-documents: ${upDoc?.path}`);

  // User 1 creates signed URL (expires in 300s)
  const { data: signedDoc, error: signErr } = await client1.storage
    .from('medikey-documents')
    .createSignedUrl(u1DocPath, 300);
  assert(!signErr && signedDoc?.signedUrl, `User 1 created short-lived (5 min) signed URL for private preview`);

  // User 2 tries to download User 1's private document
  const { data: u2DocData, error: u2DocErr } = await client2.storage
    .from('medikey-documents')
    .download(u1DocPath);
  assert(
    u2DocErr || !u2DocData,
    `Storage RLS Guard: User 2 download of User 1 document rejected (${u2DocErr?.message || 'Access Denied'})`
  );

  // User 1 uploads avatar to medikey-avatars
  const testAvatarPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
  const u1AvatarPath = `${user1Creds.id}/avatar.png`;
  const { data: upAvatar, error: upAvErr } = await client1.storage
    .from('medikey-avatars')
    .upload(u1AvatarPath, testAvatarPng, {
      contentType: 'image/png',
      upsert: true
    });
  assert(!upAvErr && upAvatar?.path, `User 1 uploaded avatar to medikey-avatars: ${upAvatar?.path}`);

  // User 2 tries to overwrite User 1's avatar
  const { data: u2AvHack, error: u2AvErr } = await client2.storage
    .from('medikey-avatars')
    .upload(u1AvatarPath, testAvatarPng, { upsert: true });
  assert(
    u2AvErr || !u2AvHack,
    `Storage RLS Guard: User 2 cannot overwrite User 1 avatar (${u2AvErr?.message || 'Access Denied'})`
  );

  // --- Step 7: Cryptographic Emergency Share Token & Public Consented RPC ---
  console.log('\n[7/7] Testing Cryptographic Emergency Share, Consent Filtering & Revocation...');

  // User 1 creates emergency share with selective consent:
  // Withholding medicines (medicines: false) to test data minimization
  const { data: shareRec, error: shareErr } = await client1.from('emergency_shares').insert({
    user_id: user1Creds.id,
    consented_fields: {
      name: true,
      blood: true,
      allergies: true,
      conditions: true,
      medicines: false, // Explicitly withheld
      emergency_contacts: true
    }
  }).select().single();

  assert(!shareErr && shareRec?.share_token, `Emergency Share Token generated: ${shareRec?.share_token}`);

  // Anonymous First-Responder queries the token via RPC
  const { data: responderPayload, error: respErr } = await anonClient.rpc('get_emergency_share', {
    p_token: shareRec.share_token
  });

  assert(
    !respErr && responderPayload?.valid === true,
    `Anonymous First-Responder RPC resolved valid emergency pass`
  );

  assert(
    responderPayload?.blood_group === 'B+' && responderPayload?.allergies?.includes('Penicillin'),
    `First-Responder received consented critical alerts (Blood: ${responderPayload?.blood_group}, Allergies: ${responderPayload?.allergies})`
  );

  assert(
    responderPayload?.emergency_contacts?.length > 0 && responderPayload.emergency_contacts[0].name === 'Mark Vance',
    `First-Responder received primary ICE contact: ${responderPayload?.emergency_contacts[0]?.name} (${responderPayload?.emergency_contacts[0]?.phone})`
  );

  assert(
    responderPayload?.medicines === null,
    `Privacy Shield: Withheld medical data (medications) was NOT exposed in emergency payload`
  );

  // Revoke the Emergency Share Token
  const { error: revErr } = await client1.from('emergency_shares').update({ is_revoked: true }).eq('id', shareRec.id);
  assert(!revErr, `User 1 revoked emergency share token`);

  // Verify revoked token is now rejected
  const { data: revokedCheck } = await anonClient.rpc('get_emergency_share', { p_token: shareRec.share_token });
  assert(
    revokedCheck?.valid === false,
    `Revocation Enforced: Revoked token immediately rejected ("${revokedCheck?.error}")`
  );

  // Cleanup test documents and records
  await client1.from('prescriptions').delete().eq('id', rx1.id);
  await client1.from('emergency_contacts').delete().eq('id', contact1.id);
  await client1.from('health_notes').delete().eq('id', note1.id);
  await client1.from('appointments').delete().eq('id', apt1.id);
  await client1.from('medical_kit').delete().eq('id', kit1.id);
  await client1.storage.from('medikey-documents').remove([u1DocPath]);
  await client1.storage.from('medikey-avatars').remove([u1AvatarPath]);

  console.log('\n======================================================================');
  console.log(`                E2E VERIFICATION TEST SUMMARY                         `);
  console.log(`======================================================================`);
  console.log(`  Total Checks: ${summary.testsPassed + summary.testsFailed}`);
  console.log(`  Passed:       ${summary.testsPassed}`);
  console.log(`  Failed:       ${summary.testsFailed}`);
  console.log(`  Result:       ${summary.testsFailed === 0 ? 'ALL CHECKS PASSED (100% SUCCESS)' : 'FAILED'}`);
  console.log('======================================================================\n');
}

runTestSuite().catch(err => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});
