const nodemailer = require('nodemailer')
const { google } = require('googleapis')
const OAuth2 = google.auth.OAuth2

const changePasswordTemplate = require('@/utils/email-template/change-pwd')

const OTPService = require('@/services/OTPService')
const recoverAccountTemplate = require('@/utils/email-template/recover-account')
const successfullyRecoverTemplate = require('@/utils/email-template/successfully-recover')
const notifyImportRequest = require('@/utils/email-template/notify-request')

class EmailService {
  constructor() {
    this.sendMailChangePassword = this.sendMailChangePassword.bind(this)
    this.sendMailRecoverAccount = this.sendMailRecoverAccount.bind(this)
    this.sendConfirmRequest = this.sendConfirmRequest.bind(this)
  }

  async createTransporter() {
    try {
      const oauth2Client = new OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      )

      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      })

      const accessToken = await oauth2Client.getAccessToken()

      if (!accessToken.token) {
        throw new Error('Failed to get access token for Gmail')
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.USER_EMAIL,
          clientId: process.env.GOOGLE_CLIENT_ID,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
          accessToken: accessToken.token,
        },
      })

      return transporter
    } catch (err) {
      console.error('Error creating email transporter:', err)
      throw new Error('Error creating email transporter')
    }
  }

  async sendMailChangePassword(req, res, next) {
    try {
      const otpCode = await OTPService.createNewOTP(req._id, 'password')

      const emailTransporter = await this.createTransporter()

      const mailOptions = {
        from: process.env.USER_EMAIL,
        to: req.email,
        subject: 'Have you requested to change your password?',
        html: changePasswordTemplate(otpCode),
      }

      if (typeof emailTransporter.sendMail !== 'function') {
        throw new Error('sendMail is not a function in the email transporter')
      }

      await emailTransporter.sendMail(mailOptions)

      return res.status(200).json({
        status: 'success',
        message: 'Successfully sent email',
      })
    } catch (error) {
      next({
        status: 500,
        error: error.message,
      })
    }
  }

  async sendMailRecoverAccount(customerId, email) {
    try {
      const otpCode = await OTPService.createNewOTP(customerId, 'recover')

      const emailTransporter = await this.createTransporter()

      const mailOptions = {
        from: process.env.USER_EMAIL,
        to: email,
        subject: 'Have you requested to recover your account?',
        html: recoverAccountTemplate(otpCode),
      }

      if (typeof emailTransporter.sendMail !== 'function') {
        throw new Error('sendMail is not a function in the email transporter')
      }

      await emailTransporter.sendMail(mailOptions)

      return true
    } catch (error) {
      throw new Error(error.message)
    }
  }

  async sendNewPassword(email, newPassword) {
    try {
      const emailTransporter = await this.createTransporter()

      const mailOptions = {
        from: process.env.USER_EMAIL,
        to: email,
        subject: 'Account Recovery Successful',
        html: successfullyRecoverTemplate(newPassword),
      }

      if (typeof emailTransporter.sendMail !== 'function') {
        throw new Error('sendMail is not a function in the email transporter')
      }

      await emailTransporter.sendMail(mailOptions)

      return true
    } catch (error) {
      throw new Error(error.message)
    }
  }

  async sendConfirmRequest(emailSupplier, nameSupplier, nameBranch, branchId) {
    try {
      const emailTransporter = await this.createTransporter()
      console.log('emailSupplier, nameSupplier, nameBranch, branchId', {
        emailSupplier,
        nameSupplier,
        nameBranch,
        branchId,
      })
      const mailOptions = {
        from: process.env.USER_EMAIL,
        to: emailSupplier,
        subject: 'Confirm Import Request',
        html: notifyImportRequest(nameSupplier, nameBranch, branchId),
      }

      if (typeof emailTransporter.sendMail !== 'function') {
        throw new Error('sendMail is not a function in the email transporter')
      }

      await emailTransporter.sendMail(mailOptions)

      return true
    } catch (error) {
      throw new Error(error)
    }
  }
}

module.exports = new EmailService()
