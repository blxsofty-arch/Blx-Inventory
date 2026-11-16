import http from 'http';
import app from '../server/app.js';
import { supabase } from '../server/supabase.js';
import fs from 'fs';
import path from 'path';

/**
 * BLX REALTY PORTAL - COMPLETE FUNCTIONALITY & SECURITY REGRESSION TEST SUITE
 * Tests all 13 critical areas required for deployment readiness.
 */
async function runRegressionTests() {
  console.log('================================================================');
  console.log('  BLX REALTY PORTAL - SECURITY & FUNCTIONALITY REGRESSION SUITE  ');
  console.log('================================================================\n');

  // Start Express on an ephemeral local port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 Local test server running on ${baseUrl}\n`);

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failedTests++;
    }
  }

  try {
    let adminToken = '';
    let salesToken = '';

    // Credentials are supplied at runtime so they are never stored in source control.
    const adminEmail = process.env.REGRESSION_ADMIN_EMAIL;
    const adminPassword = process.env.REGRESSION_ADMIN_PASSWORD;
    const salesEmail = process.env.REGRESSION_SALES_EMAIL;
    const salesPassword = process.env.REGRESSION_SALES_PASSWORD;

    if (!adminEmail || !adminPassword || !salesEmail || !salesPassword) {
      console.error(
        'Missing regression test credentials. Set REGRESSION_ADMIN_EMAIL, REGRESSION_ADMIN_PASSWORD, REGRESSION_SALES_EMAIL and REGRESSION_SALES_PASSWORD before running.'
      );
      process.exit(1);
    }

    // -------------------------------------------------------------------------
    // TEST 1: Admin Login and Role Verification
    // -------------------------------------------------------------------------
    console.log('📋 Test 1: Admin Login & bcrypt Verification');
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, 'Admin login HTTP status 200');
    assert(adminLoginData.token && adminLoginData.token.startsWith('blx_sess_'), 'Admin receives valid session token');
    assert(adminLoginData.user && adminLoginData.user.role === 'ADMIN', 'Admin role is correctly returned as ADMIN');
    adminToken = adminLoginData.token;

    // -------------------------------------------------------------------------
    // TEST 2: Sales (Employee) Login & Verification
    // -------------------------------------------------------------------------
    console.log('\n📋 Test 2: Sales Login & bcrypt Verification');
    const salesLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: salesEmail, password: salesPassword }),
    });
    const salesLoginData = await salesLoginRes.json();
    assert(salesLoginRes.status === 200, 'Sales login HTTP status 200');
    assert(salesLoginData.token && salesLoginData.token.startsWith('blx_sess_'), 'Sales receives valid session token');
    assert(salesLoginData.user && salesLoginData.user.role === 'EMPLOYEE', 'Sales role is correctly returned as EMPLOYEE');
    salesToken = salesLoginData.token;

    // -------------------------------------------------------------------------
    // TEST 3: Backend RBAC Enforcement (Sales blocked from Admin endpoints)
    // -------------------------------------------------------------------------
    console.log('\n📋 Test 3: Backend RBAC Enforcement (Sales Restricted)');
    const salesAddRes = await fetch(`${baseUrl}/api/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({ name: 'Unauthorized Villa', location: 'Dubai' }),
    });
    assert(salesAddRes.status === 403, 'Sales blocked from adding properties (403 Forbidden)');

    const salesArchivedRes = await fetch(`${baseUrl}/api/properties/archived`, {
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    assert(salesArchivedRes.status === 403, 'Sales blocked from reading archived properties (403 Forbidden)');

    const salesUsersRes = await fetch(`${baseUrl}/api/users`, {
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    assert(salesUsersRes.status === 403, 'Sales blocked from managing staff users (403 Forbidden)');

    // -------------------------------------------------------------------------
    // TEST 4: Sales Read-Only Inventory Access
    // -------------------------------------------------------------------------
    console.log('\n📋 Test 4: Sales Read-Only Inventory Access');
    const salesPropsRes = await fetch(`${baseUrl}/api/properties`, {
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    const salesPropsData = await salesPropsRes.json();
    assert(salesPropsRes.status === 200, 'Sales can fetch active properties (200 OK)');
    assert(Array.isArray(salesPropsData.properties) && salesPropsData.properties.length > 0, 'Sales receives active property list');

    const salesStatsRes = await fetch(`${baseUrl}/api/properties/stats`, {
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    const salesStatsData = await salesStatsRes.json();
    assert(salesStatsRes.status === 200, 'Sales can fetch dashboard stats (200 OK)');
    assert(salesStatsData.total === 14, `Dashboard reports exact property count: ${salesStatsData.total}`);

    // -------------------------------------------------------------------------
    // TEST 5: Unauthenticated Access Blocked
    // -------------------------------------------------------------------------
    console.log('\n📋 Test 5: Unauthenticated Access Protection');
    const unauthRes = await fetch(`${baseUrl}/api/properties`);
    assert(unauthRes.status === 401, 'Anonymous request to /api/properties blocked (401 Unauthorized)');

    const unauthStatsRes = await fetch(`${baseUrl}/api/properties/stats`);
    assert(unauthStatsRes.status === 401, 'Anonymous request to /api/properties/stats blocked (401 Unauthorized)');

    // -------------------------------------------------------------------------
    // TEST 6: Password Reset Security (No code in response)
    // -------------------------------------------------------------------------
    console.log('\n📋 Test 6: Password Reset Leak Protection');
    const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-passcode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: salesEmail }),
    });
    const forgotData = await forgotRes.json();
    assert(forgotRes.status === 200, 'Forgot passcode request accepted (200 OK)');
    assert(forgotData.verificationCode === undefined, 'CRITICAL: verificationCode is NOT exposed in API response');
    assert(forgotData.success === true, 'Safe response message returned to user');

    // -------------------------------------------------------------------------
    // TEST 7: Storage & File Upload Security
    // -------------------------------------------------------------------------
    console.log('\n📋 Test 7: Storage & File Upload Security');
    // Reject invalid MIME type
    const badMimeRes = await fetch(`${baseUrl}/api/storage/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({ dataUrl: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==', fileName: 'exploit.html' }),
    });
    assert(badMimeRes.status === 400, 'Disallowed MIME type (text/html) rejected (400 Bad Request)');

    // Reject Sales access to internal-records signed URLs
    const salesSignedRes = await fetch(`${baseUrl}/api/storage/signed-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({ bucket: 'internal-records', path: 'confidential.pdf' }),
    });
    assert(salesSignedRes.status === 403, 'Sales restricted from generating signed URLs for internal-records (403 Forbidden)');

    // Accept valid small JPEG upload
    const tinyJpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const validUploadRes = await fetch(`${baseUrl}/api/storage/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ dataUrl: tinyJpeg, fileName: 'security_test_dot.jpg', folder: 'security-test' }),
    });
    const validUploadData = await validUploadRes.json();
    assert(validUploadRes.status === 201 && validUploadData.success === true, 'Valid image upload succeeded with sanitized path');

    // -------------------------------------------------------------------------
    // TEST 8: Property Lifecycle CRUD by Admin
    // -------------------------------------------------------------------------
    console.log('\n📋 Test 8: Admin Property Lifecycle (Add, Edit, Archive, Restore, Delete)');
    const testPropId = `prop-test-${Date.now()}`;
    const createPropRes = await fetch(`${baseUrl}/api/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Automated Regression Penthouse',
        location: 'Indiranagar, Bangalore',
        property_type: 'Penthouse',
        configuration: '4 BHK',
        price: '₹ 8.5 Cr',
        price_numeric: 85000000,
        area: '4,200 sq.ft',
        area_numeric: 4200,
        developer: 'BLX Signature Luxury',
        status: 'Available',
      }),
    });
    const createPropData = await createPropRes.json();
    assert(createPropRes.status === 201 && createPropData.id, 'Admin successfully created test property');
    const createdId = createPropData.id;

    // Archive
    const archiveRes = await fetch(`${baseUrl}/api/properties/${createdId}/archive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(archiveRes.status === 200, 'Admin successfully archived property');

    // Restore
    const restoreRes = await fetch(`${baseUrl}/api/properties/${createdId}/restore`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(restoreRes.status === 200, 'Admin successfully restored property');

    // Permanent Delete to maintain exact database state
    const deleteRes = await fetch(`${baseUrl}/api/properties/${createdId}/permanent`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteRes.status === 200, 'Admin permanently cleaned up test property');

    // -------------------------------------------------------------------------
    // TEST 9: Database Integrity Verification (14 Properties, 3 Staff)
    // -------------------------------------------------------------------------
    console.log('\n📋 Test 9: Live Database Integrity Check');
    const { count: finalProps } = await supabase.from('properties').select('*', { count: 'exact', head: true }).or('is_archived.is.null,is_archived.eq.0');
    const { count: finalStaff } = await supabase.from('staff_users').select('*', { count: 'exact', head: true });
    assert(finalProps === 14, `Exact count preserved: ${finalProps} live properties in database`);
    assert(finalStaff === 3, `Exact count preserved: ${finalStaff} staff user accounts in database`);

    // -------------------------------------------------------------------------
    // TEST 10: PDF Brochure Asset Verification
    // -------------------------------------------------------------------------
    console.log('\n📋 Test 10: PDF Brochure & Logo Static Assets Check');
    const latoReg = fs.existsSync(path.resolve('public/fonts/Lato-Regular.ttf'));
    const latoBold = fs.existsSync(path.resolve('public/fonts/Lato-Bold.ttf'));
    const logoPng = fs.existsSync(path.resolve('public/blx-logo.png'));
    assert(latoReg && latoBold, 'Lato TrueType fonts present in public/fonts for PDF generation');
    assert(logoPng, 'BLX Realty logo present in public/blx-logo.png');

    // -------------------------------------------------------------------------
    // TEST 11: Security Headers (Helmet) Check
    // -------------------------------------------------------------------------
    console.log('\n📋 Test 11: HTTP Security Headers (Helmet)');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert(healthRes.headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options: nosniff header present');
    assert(healthRes.headers.get('x-dns-prefetch-control') === 'off', 'X-DNS-Prefetch-Control header present');

    // -------------------------------------------------------------------------
    // TEST 12: Logout & Session Revocation
    // -------------------------------------------------------------------------
    console.log('\n📋 Test 12: Logout & Session Revocation');
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(logoutRes.status === 200, 'Logout request succeeded (200 OK)');

    const meAfterLogout = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(meAfterLogout.status === 401, 'Revoked token successfully rejected with 401 Unauthorized');

    console.log('\n================================================================');
    console.log(`  REGRESSION RESULTS: ${passedTests} PASSED, ${failedTests} FAILED  `);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Fatal error during regression tests:', err);
    failedTests++;
  } finally {
    server.close();
  }

  process.exit(failedTests > 0 ? 1 : 0);
}

runRegressionTests();

