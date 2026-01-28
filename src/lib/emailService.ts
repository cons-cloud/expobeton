import { createEmailSent, updateEmailStatus } from './supabase'
import { sendEmail as sendEmailViaResend } from '../services/emailService'

// Configuration du service d'emails
interface EmailConfig {
  from: string
  replyTo?: string
  adminEmail?: string
}

const emailConfig: EmailConfig = {
  from: 'noreply@expobetonrdc.com',
  replyTo: 'support@expobetonrdc.com',
  adminEmail: import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com'
}

// Interface pour les données d'email
export interface EmailData {
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
  campaignId?: string
}

// Fonction pour envoyer un accusé de réception à l'administrateur
export const sendReceiptEmail = async () => {
  if (!emailConfig.adminEmail) {
    console.warn('Email administrateur non configuré')
    return
  }

  try {
    await sendEmailViaResend({
      to: emailConfig.adminEmail,
      subject: 'Accusé de réception - Email envoyé',
      html: '<p>Un email a été envoyé avec succès via Expobeton Email.</p>'
    })
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'accusé de réception:', error)
  }
}

// Fonction principale d'envoi d'email avec stockage dans Supabase
export const sendEmail = async (emailData: EmailData): Promise<{ success: boolean; emailId?: string; error?: string }> => {
  try {
    // 1. Créer l'enregistrement dans Supabase avec statut "pending"
    const emailRecord = await createEmailSent({
      campaign_id: emailData.campaignId,
      recipient_email: emailData.to,
      recipient_name: emailData.toName,
      subject: emailData.subject,
      content: emailData.html,
      status: 'pending'
    })

    // 2. Mettre à jour le statut à "sending"
    await updateEmailStatus(emailRecord.id, 'pending')

    // 3. Envoyer l'email via Resend
    try {
      await sendEmailViaResend({
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });

      // 4. Si succès, mettre à jour le statut à "sent"
      await updateEmailStatus(emailRecord.id, 'sent')
      
      // 5. Envoyer l'accusé de réception à l'administrateur
      await sendReceiptEmail()
      
      // 6. Simuler la livraison (en production, ceci viendrait des webhooks du provider)
      setTimeout(async () => {
        try {
          await updateEmailStatus(emailRecord.id, 'delivered')
        } catch (error) {
          console.error('Erreur lors de la mise à jour du statut delivered:', error)
        }
      }, 3000 + Math.random() * 5000)

      return {
        success: true,
        emailId: emailRecord.id
      }
    } catch (error) {
      // Gérer l'erreur d'envoi
      await updateEmailStatus(emailRecord.id, 'failed')
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      return {
        success: false,
        error: errorMessage
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

// Fonction pour envoyer des emails en masse (campagne)
export const sendBulkEmails = async (
  emails: EmailData[],
  onProgress?: (sent: number, total: number, currentEmail: string) => void
): Promise<{ success: number; failed: number; errors: string[] }> => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  }

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i]
    
    if (onProgress) {
      onProgress(i, emails.length, email.to)
    }

    try {
      const result = await sendEmail(email)
      if (result.success) {
        results.success++
      } else {
        results.failed++
        results.errors.push(`${email.to}: ${result.error}`)
      }
    } catch (error) {
      results.failed++
      results.errors.push(`${email.to}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }

    // Petit délai entre les envois pour éviter de surcharger le provider
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return results
}

// Fonction pour créer le contenu HTML de l'email
export const createEmailHTML = (subject: string, content: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding: 20px;
          background: #f3f4f6;
          border-radius: 10px;
          font-size: 12px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Expobeton Email</h1>
        <p>${subject}</p>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>Cet email a été envoyé via la plateforme Expobeton Email</p>
        <p>© 2024 Expobeton RDC. Tous droits réservés.</p>
      </div>
    </body>
    </html>
  `
}

// Fonction pour configurer l'email de l'administrateur
export const setAdminEmail = (email: string) => {
  emailConfig.adminEmail = email
}

// Fonction pour obtenir l'email de l'administrateur
export const getAdminEmail = (): string | undefined => {
  return emailConfig.adminEmail
}

export default {
  sendEmail,
  sendBulkEmails,
  createEmailHTML,
  setAdminEmail,
  getAdminEmail
}
