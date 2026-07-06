const PROJECT_PATTERNS = {
  '3231': { name: 'CHAUMET JOSEPHINE S1 2027', client: 'Chaumet' },
  '3206': { name: 'VACHERON CONSTANTIN - Pitch Production', client: 'Vacheron Constantin' },
  '3223': { name: 'LOUIS VUITTON BAG SPA', client: 'Louis Vuitton' },
  '3207': { name: 'HUBLOT JEANS', client: 'Hublot' },
  '3145': { name: 'CHOPARD HAPPY SPORT', client: 'Chopard' },
  '3222': { name: 'HUBLOT VELVET ANIMATION', client: 'Hublot' },
  '3225': { name: 'CHOPARD TROPHÉES TDCH', client: 'Chopard' },
  '3202': { name: 'JAEGER-LECOULTRE 2027 WINDOWS', client: 'Jaeger-LeCoultre' },
  '3205': { name: 'HOLIDAY SEASON WINDOWS ANIMATION', client: 'Global' },
  '3164': { name: 'LOUIS VUITTON W3 TRAIN EXTERIORS', client: 'Louis Vuitton' },
  '3198': { name: 'LOUIS VUITTON MINI WORLDS NETWORK', client: 'Louis Vuitton' },
  '3230': { name: 'LOUIS VUITTON STRAPS', client: 'Louis Vuitton' },
  '3203': { name: 'HENNESSY DISPLAY', client: 'Hennessy' },
  '3114': { name: 'SINGAPORE ION BOUTIQUE', client: 'Jaeger-LeCoultre' },
  '3045': { name: 'JAEGER-LECOULTRE JAPAN GINZA SIX', client: 'JLC' }
};

const URGENT_KEYWORDS = ['URGENT', 'ASAP', 'TODAY', 'CRITICAL', 'PRIORITY'];
const DEADLINE_KEYWORDS = ['deadline', 'by', 'due', 'before', 'until', 'latest'];

function extractProjectNumber(subject) {
  const match = subject.match(/(\d{4})/);
  return match ? match[1] : null;
}

function extractPriority(email) {
  const text = `${email.subject} ${email.bodyPreview || ''}`.toUpperCase();

  if (email.importance === 'high' || URGENT_KEYWORDS.some(kw => text.includes(kw))) {
    return 'URGENT';
  }

  const senders = {
    'sandra.bastiat@media6.com': 'HIGH',
    '@chaumet.com': 'URGENT'
  };

  for (const [sender, priority] of Object.entries(senders)) {
    if (email.from?.emailAddress?.address?.includes(sender)) {
      return priority;
    }
  }

  return 'NORMAL';
}

function extractDeadline(email) {
  const text = `${email.subject} ${email.bodyPreview || ''}`;
  const datePatterns = [
    /(\d{1,2}(?:st|nd|rd|th)?)\s+(?:of\s+)?([A-Za-z]+)/gi,
    /([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/gi,
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g
  ];

  for (const pattern of datePatterns) {
    const match = pattern.exec(text);
    if (match) return match[0];
  }

  return null;
}

function processEmails(emails) {
  const projects = {};
  const urgent = [];
  const high = [];
  const normal = [];

  for (const email of emails) {
    const projectNum = extractProjectNumber(email.subject);
    if (!projectNum) continue;

    const projectInfo = PROJECT_PATTERNS[projectNum] || {
      name: `Project ${projectNum}`,
      client: 'Unknown'
    };

    const priority = extractPriority(email);
    const deadline = extractDeadline(email);

    // Group by project
    if (!projects[projectNum]) {
      projects[projectNum] = {
        number: projectNum,
        name: projectInfo.name,
        client: projectInfo.client,
        emails: [],
        priority,
        deadlines: []
      };
    }

    projects[projectNum].emails.push({
      subject: email.subject,
      from: email.from?.emailAddress?.address,
      date: email.receivedDateTime
    });

    if (deadline) {
      projects[projectNum].deadlines.push(deadline);
    }

    // Categorize
    if (priority === 'URGENT') urgent.push(projectNum);
    else if (priority === 'HIGH') high.push(projectNum);
    else normal.push(projectNum);
  }

  return {
    projects: Object.values(projects),
    urgent: [...new Set(urgent)],
    high: [...new Set(high)],
    normal: [...new Set(normal)],
    total: emails.length
  };
}

module.exports = { processEmails };
