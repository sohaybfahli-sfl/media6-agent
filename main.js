const schedule = require('node-schedule');
const { readEmails, getAllEmails } = require('./reader');
const { processEmails } = require('./processor');
const { sendEmailSummary, createCalendarEvents } = require('./sender');
const fs = require('fs');
const path = require('path');

// State file for tracking processed emails
const STATE_FILE = './agent-state.json';

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error loading state:', e.message);
  }
  return { processedMessageIds: [], lastBackfill: null, lastRun: null };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('Error saving state:', e.message);
  }
}

async function runAgent(mode = 'incremental') {
  console.log(`\n🤖 AGENT RUNNING - Mode: ${mode}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);

  const state = loadState();

  try {
    let emails = [];

    if (mode === 'backfill' || !state.lastBackfill) {
      // First run: backfill all 310 emails
      console.log('📬 BACKFILL MODE - Reading all 310 emails...');
      emails = await getAllEmails();
      state.lastBackfill = new Date().toISOString();
    } else {
      // Incremental: last 24 hours
      console.log('📬 INCREMENTAL MODE - Reading last 24h emails...');
      emails = await readEmails(1); // last 1 day
    }

    console.log(`✅ Read ${emails.length} emails`);

    // Filter out already processed emails
    const newEmails = emails.filter(
      email => !state.processedMessageIds.includes(email.id)
    );

    if (newEmails.length === 0) {
      console.log('✅ No new emails to process');
      return;
    }

    console.log(`🔄 Processing ${newEmails.length} new emails...`);

    // Process emails
    const summary = processEmails(newEmails);

    console.log('📊 Summary:');
    console.log(`   Projects: ${summary.projects.length}`);
    console.log(`   Urgent: ${summary.urgent.length}`);
    console.log(`   High: ${summary.high.length}`);

    // Send email summary
    console.log('📧 Sending email summary...');
    await sendEmailSummary(summary, mode);

    // Create calendar events for deadlines
    console.log('📅 Creating calendar events...');
    await createCalendarEvents(summary);

    // Update state
    state.processedMessageIds = [
      ...new Set([
        ...state.processedMessageIds,
        ...newEmails.map(e => e.id)
      ])
    ];
    state.lastRun = new Date().toISOString();
    saveState(state);

    console.log('✅ Agent run complete!\n');
  } catch (error) {
    console.error('❌ Agent error:', error.message);
    console.error(error.stack);
  }
}

// Check if running as manual trigger
const args = process.argv.slice(2);
if (args.includes('--run')) {
  console.log('🚀 Manual agent trigger');
  runAgent(args.includes('--backfill') ? 'backfill' : 'incremental').then(() => {
    process.exit(0);
  });
} else if (args.includes('--server')) {
  // Start as HTTP server for manual triggers
  const express = require('express');
  const app = express();

  app.get('/run', async (req, res) => {
    console.log('🌐 HTTP trigger received');
    await runAgent('incremental');
    res.json({ status: 'Agent executed' });
  });

  app.get('/backfill', async (req, res) => {
    console.log('🌐 Backfill trigger received');
    await runAgent('backfill');
    res.json({ status: 'Backfill executed' });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`   GET /run - incremental run`);
    console.log(`   GET /backfill - full backfill`);
  });
} else {
  // Scheduled runs
  console.log('🤖 MEDIA6 WORKFLOW AGENT - SCHEDULED MODE');
  console.log('⏰ Schedules:');
  console.log('   21:30 (9:30 PM) - Evening summary');
  console.log('   07:30 (7:30 AM) - Morning refresh');
  console.log('   Friday 18:00 - Weekly summary\n');

  // Evening summary - 21:30 Swiss time (CET/CEST)
  schedule.scheduleJob('30 21 * * *', async () => {
    console.log('\n📅 [SCHEDULED] Evening summary (21:30)');
    await runAgent('incremental');
  });

  // Morning refresh - 07:30 Swiss time
  schedule.scheduleJob('30 7 * * *', async () => {
    console.log('\n📅 [SCHEDULED] Morning refresh (07:30)');
    await runAgent('incremental');
  });

  // Weekly summary - Friday 18:00 Swiss time
  schedule.scheduleJob('0 18 * * 5', async () => {
    console.log('\n📅 [SCHEDULED] Weekly summary (Friday 18:00)');
    await runAgent('weekly');
  });

  console.log('✅ Agent ready. Waiting for scheduled tasks...\n');
}
