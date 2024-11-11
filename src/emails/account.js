// Require:
const postmark = require("postmark");

// Send an email:
const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

const sendWelcomeEmail = (email, name) => {
  client.sendEmail({
    From: "hn_rachedi@esi.dz",
    To: email,
    Subject: "Thank you for joining in!",
    /*HtmlBody: "<strong>Hello</strong> dear Postmark user.",*/
    TextBody: `Welcome to the app, ${name}! Let me know how you get along with the app.`,
    MessageStream: "outbound",
  });
}

const sendCancelEmail = (email, name) => {
  client.sendEmail({
    From: "hn_rachedi@esi.dz",
    To: email,
    Subject: "Account Deleted - We're Sorry To See You Go!",
    HtmlBody: `Dear ${name}, 
      <br>
      We're sorry to see you leave, and we'd love to hear why you're leaving --your feedback helps us make things better for everyone. <br>If there's anything we could improve, or if you ever want to come back, we'll be here to welcome you. <br>Take care, <br><strong> Task App Team </strong>
      `,
    /*TextBody: `
      Dear ${name}, We're sorry to see you leave, and we'd love to hear why you're leaving --your feedback helps us make things better for everyone.`,*/
    MessageStream: "outbound",
  });
}

module.exports = {
  sendWelcomeEmail,
  sendCancelEmail
}