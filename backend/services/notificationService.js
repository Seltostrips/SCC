const nodemailer = require('nodemailer');
const twilio = require('twilio');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

module.exports = {
  notifyClients: async (entry) => {
    try {
      // Get all client users
      const clients = await User.find({ role: 'client' });
      
      for (const clientUser of clients) {
        // Send email
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: clientUser.email,
          subject: 'New Inventory Entry Requires Review',
          html: `
            <p>A new inventory entry requires your review:</p>
            <ul>
              <li>Bin ID: ${entry.binId}</li>
              <li>Book Quantity: ${entry.bookQuantity}</li>
              <li>Actual Quantity: ${entry.actualQuantity}</li>
              <li>Discrepancy: ${entry.discrepancy}</li>
            </ul>
            <p>Please log in to the portal to review this entry.</p>
          `
        });
        
        // Send WhatsApp if phone number is available
        if (clientUser.phone) {
          await client.messages.create({
            body: `New inventory entry requires review. Bin ID: ${entry.binId}, Discrepancy: ${entry.discrepancy}`,
            from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
            to: `whatsapp:${clientUser.phone}`
          });
        }
      }
    } catch (error) {
      console.error('Error sending client notifications:', error);
    }
  },
  
  notifyClient: async (client, entry) => {
    try {
      // Send email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: client.email,
        subject: 'New Inventory Entry Requires Review',
        html: `
          <p>A new inventory entry requires your review:</p>
          <ul>
            <li>Bin ID: ${entry.binId}</li>
            <li>Book Quantity: ${entry.bookQuantity}</li>
            <li>Actual Quantity: ${entry.actualQuantity}</li>
            <li>Discrepancy: ${entry.discrepancy}</li>
          </ul>
          <p>Please log in to the portal to review this entry.</p>
        `
      });
      
      // Send WhatsApp if phone number is available
      if (client.phone) {
        await client.messages.create({
          body: `New inventory entry requires review. Bin ID: ${entry.binId}, Discrepancy: ${entry.discrepancy}`,
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: `whatsapp:${client.phone}`
        });
      }
    } catch (error) {
      console.error('Error sending client notification:', error);
    }
  },
  
  notifyStaff: async (entry, message) => {
    try {
      const staff = await User.findById(entry.staffId);
      
      // Send email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: staff.email,
        subject: 'Inventory Entry Update',
        html: `
          <p>${message}</p>
          <p>Bin ID: ${entry.binId}</p>
          <p>Please log in to the portal for more details.</p>
        `
      });
      
      // Send WhatsApp if phone number is available
      if (staff.phone) {
        await client.messages.create({
          body: `${message} Bin ID: ${entry.binId}`,
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: `whatsapp:${staff.phone}`
        });
      }
    } catch (error) {
      console.error('Error sending staff notification:', error);
    }
  },

  // New function to notify admin about pending user approval
  notifyAdmin: async (adminUser, newUser) => {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: adminUser.email,
        subject: 'New User Pending Approval',
        html: `
          <p>A new user has registered and is pending your approval:</p>
          <ul>
            <li>Name: ${newUser.name}</li>
            <li>Email: ${newUser.email}</li>
            <li>Role: ${newUser.role}</li>
            ${newUser.company ? `<li>Company: ${newUser.company}</li>` : ''}
            ${newUser.uniqueCode ? `<li>Unique Code: ${newUser.uniqueCode}</li>` : ''}
          </ul>
          <p>Please log in to the admin portal to review and approve this user.</p>
        `
      });

      if (adminUser.phone) {
        await client.messages.create({
          body: `New user ${newUser.name} (${newUser.role}) is pending approval. Check admin portal.`,
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: `whatsapp:${adminUser.phone}`
        });
      }
    } catch (error) {
      console.error('Error sending admin notification for new user:', error);
    }
  },

  // New function to notify user about account approval
  notifyUserApproval: async (approvedUser) => {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: approvedUser.email,
        subject: 'Your Account Has Been Approved!',
        html: `
          <p>Dear ${approvedUser.name},</p>
          <p>Your account for the Inventory Audit Control Portal has been approved by an administrator.</p>
          <p>You can now log in using your credentials.</p>
          <p>Thank you!</p>
        `
      });

      if (approvedUser.phone) {
        await client.messages.create({
          body: `Your Inventory Audit Control Portal account has been approved! You can now log in.`,
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: `whatsapp:${approvedUser.phone}`
        });
      }
    } catch (error) {
      console.error('Error sending user approval notification:', error);
    }
  }
};
