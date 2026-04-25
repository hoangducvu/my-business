import { google } from 'googleapis';
import { readFileSync } from 'fs';

// Parse .env.local manually (handles multiline values)
const raw = readFileSync('/sessions/funny-nice-dirac/mnt/my-business/.env.local', 'utf8');
const env = {};
let currentKey = null;
let currentVal = [];
for (const line of raw.split('\n')) {
  const eqIdx = line.indexOf('=');
  if (eqIdx > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
    if (currentKey) env[currentKey] = currentVal.join('\n');
    currentKey = line.slice(0, eqIdx);
    currentVal = [line.slice(eqIdx + 1)];
  } else if (currentKey) {
    currentVal.push(line);
  }
}
if (currentKey) env[currentKey] = currentVal.join('\n');

const SPREADSHEET_ID = env['GOOGLE_SPREADSHEET_ID'];
const creds = JSON.parse(env['GOOGLE_SERVICE_ACCOUNT_JSON']);

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

async function run() {
  // 1. List existing sheets
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetNames = meta.data.sheets.map(s => s.properties.title);
  console.log('Existing sheets:', sheetNames);

  // 2. Create Availability tab if missing
  if (!sheetNames.includes('Availability')) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: 'Availability' } } }] },
    });
    console.log('✓ Created Availability sheet');
  } else {
    console.log('Availability sheet already exists');
  }

  // 3. Populate Availability (header + data rows)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Availability!A1:D6',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['date', 'display', 'day', 'spotsLeft'],
        ['2026-04-25', 'Apr 25', 'Fri', '3'],
        ['2026-05-02', 'May 2',  'Sat', '8'],
        ['2026-05-09', 'May 9',  'Fri', '6'],
        ['2026-05-16', 'May 16', 'Sat', '2'],
        ['2026-05-23', 'May 23', 'Fri', '10'],
      ],
    },
  });
  console.log('✓ Availability sheet populated');

  // 4. Check / update Leads header
  const leadsHeader = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Leads!A1:J1',
  });
  const existing = leadsHeader.data.values?.[0] ?? [];
  console.log('Leads current header:', existing);

  if (existing.length < 10) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Leads!A1:J1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['id', 'name', 'email', 'phone', 'type', 'submittedAt', 'date', 'time', 'activity', 'partySize']],
      },
    });
    console.log('✓ Leads header extended to 10 columns');
  } else {
    console.log('Leads header already has 10+ columns');
  }
}

run().catch(err => { console.error(err); process.exit(1); });
