const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testSMTP() {
  console.log('===================================================');
  console.log('  SMTP MAIL CONFIGURATION DIAGNOSTICS');
  console.log('===================================================');
  
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`Pass: ${pass ? '****' : '(EMPTY!)'}`);
  console.log(`From: ${from}`);

  if (!host || !user || !pass) {
    console.error('\n❌ ERROR: SMTP settings are incomplete in your .env file!');
    return;
  }

  const secure = port === '465';
  console.log(`Secure (SSL/TLS): ${secure}`);

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });

  console.log('\nTesting SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP Connection successful! Your SMTP settings are correct.');

    console.log(`\nAttempting to send a test email to ${user}...`);
    const info = await transporter.sendMail({
      from: from,
      to: user,
      subject: 'Test Email - SMTP Diagnostics',
      text: 'SMTP is working perfectly! Your website forgot password feature will now be able to send emails.',
      html: '<h3>SMTP is working perfectly!</h3><p>Your website forgot password feature will now be able to send emails.</p>'
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);

  } catch (error) {
    console.error('\n❌ SMTP Error occurred:', error);
  }
}

testSMTP();
