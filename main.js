const express = require('express');
const { readEmails, getAllEmails } = require('./reader');
const { processEmails } = require('./processor');
const { sendEmailSummary, createCalendarEvents } = require('./sender');

async function runAgent(mode = 'incremental') {
  console.log(`\n🤖 AGENT RUNNING - Mode: ${mode}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);

  try {
    let emails = [];

    if (mode === 'backfill') {
      console.log('📬 BACKFILL MODE - Reading all 310 emails...');
      emails = await getAllEmails();
    } else {
      console.log('📬 INCREMENTAL MODE - Reading last 24h emails...');
      emails = await readEmails(1);
    }

    console.log(`✅ Read ${emails.length} emails`);

    if (emails.length === 0) {
      console.log('✅ No emails to process');
      return { status: 'No emails' };
    }

    console.log(`🔄 Processing ${emails.length} emails...`);
    const summary = processEmails(emails);

    console.log('📊 Summary:');
    console.log(`   Projects: ${summary.projects.length}`);
    console.log(`   Urgent: ${summary.urgent.length}`);
    console.log(`   High: ${summary.high.length}`);

    console.log('📧 Sending email summary...');
    await sendEmailSummary(summary, mode);

    console.log('📅 Creating calendar events...');
    await createCalendarEvents(summary);

    console.log('✅ Agent run complete!\n');
    return { status: 'Success', summary };
  } catch (error) {
    console.error('❌ Agent error:', error.message);
    console.error(error.stack);
    return { status: 'Error', error: error.message };
  }
}

const app = express();

app.get('/', (req, res) => {
  res.json({ status: 'Agent running' });
});

app.get('/run', async (req, res) => {
  console.log('🌐 HTTP /run triggered');
  const result = await runAgent('incremental');
  res.json(result);
});

app.get('/backfill', async (req, res) => {
  console.log('🌐 HTTP /backfill triggered');
  const result = await runAgent('backfill');
  res.json(result);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🌐 MEDIA6 AGENT SERVER`);
  console.log(`⏰ Started: ${new Date().toISOString()}`);
  console.log(`🔗 Port: ${PORT}`);
  console.log(`\n📍 Available endpoints:`);
  console.log(`   GET / - status`);
  console.log(`   GET /run - incremental run (last 24h)`);
  console.log(`   GET /backfill - full backfill (all 310)\n`);
});