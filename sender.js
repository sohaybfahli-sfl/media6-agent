const axios = require('axios');
const { getAccessToken } = require('./auth');

async function sendEmailSummary(summary, mode = 'incremental') {
  try {
    const token = await getAccessToken();

    const urgentList = summary.urgent
      .map(pNum => summary.projects.find(p => p.number === pNum))
      .filter(p => p)
      .map(p => `• ${p.number} - ${p.name} (${p.client})`)
      .join('\n');

    const highList = summary.high
      .map(pNum => summary.projects.find(p => p.number === pNum))
      .filter(p => p)
      .map(p => `• ${p.number} - ${p.name} (${p.client})`)
      .join('\n');

    const projectDetails = summary.projects
      .map(p => {
        const emails = p.emails.slice(0, 3);
        return `\n🔹 ${p.number} - ${p.name}\n   Client: ${p.client}\n   Emails: ${emails.length}\n   Topics: ${emails.map(e => e.subject.substring(0, 50)).join(' | ')}`;
      })
      .join('\n');

    const emailBody = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2>📊 Media6 Workflow Agent Summary</h2>
  
  <p><strong>Mode:</strong> ${mode === 'backfill' ? '🔄 Full Backfill' : '📬 Incremental (24h)'}</p>
  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
  
  <hr>
  
  <h3>🔴 URGENT (${summary.urgent.length})</h3>
  <pre>${urgentList || 'None'}</pre>
  
  <h3>🟡 HIGH (${summary.high.length})</h3>
  <pre>${highList || 'None'}</pre>
  
  <h3>📋 All Projects (${summary.projects.length})</h3>
  <pre>${projectDetails}</pre>
  
  <hr>
  
  <p><strong>Total Emails Processed:</strong> ${summary.total}</p>
  <p><em>Calendar events created for all deadlines</em></p>
</body>
</html>
    `.trim();

    const messageData = {
      message: {
        subject: `[${mode === 'backfill' ? 'BACKFILL' : 'UPDATE'}] Media6 Workflow Summary - ${new Date().toLocaleDateString()}`,
        body: {
          contentType: 'HTML',
          content: emailBody
        },
        toRecipients: [
          {
            emailAddress: {
              address: 'sohayb.fahli-laout@media6.com'
            }
          }
        ]
      },
      saveToSentItems: true
    };

    const response = await axios.post(
      'https://graph.microsoft.com/v1.0/me/sendMail',
      messageData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Email sent successfully');
    return response.status === 202;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    if (error.response?.data) {
      console.error('   Response:', error.response.data);
    }
    return false;
  }
}

async function createCalendarEvents(summary) {
  try {
    const token = await getAccessToken();
    let created = 0;

    for (const project of summary.projects) {
      if (project.deadlines.length === 0) continue;

      for (const deadline of project.deadlines) {
        try {
          const eventData = {
            subject: `[${project.number}] ${project.name} - Deadline`,
            body: {
              contentType: 'HTML',
              content: `<p>Project: ${project.number} - ${project.name}</p><p>Client: ${project.client}</p>`
            },
            start: {
              dateTime: parseDeadlineToISO(deadline),
              timeZone: 'Europe/Zurich'
            },
            end: {
              dateTime: new Date(new Date(parseDeadlineToISO(deadline)).getTime() + 3600000).toISOString(),
              timeZone: 'Europe/Zurich'
            },
            categories: [`Project-${project.number}`],
            isReminderOn: true,
            reminderMinutesBeforeStart: 1440 // 1 day before
          };

          await axios.post(
            'https://graph.microsoft.com/v1.0/me/events',
            eventData,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          created++;
          console.log(`   ✅ Event created: ${project.number} - ${deadline}`);
        } catch (e) {
          console.log(`   ⚠️  Could not create event for ${project.number}: ${e.message}`);
        }
      }
    }

    console.log(`📅 Calendar events created: ${created}`);
    return created;
  } catch (error) {
    console.error('❌ Error creating calendar events:', error.message);
    return 0;
  }
}

function parseDeadlineToISO(deadlineText) {
  // Try to parse various date formats and return ISO string
  // Fallback to tomorrow if parsing fails
  try {
    const date = new Date(deadlineText);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {}

  // Fallback: schedule for next Monday
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString();
}

module.exports = {
  sendEmailSummary,
  createCalendarEvents
};
