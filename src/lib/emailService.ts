import { createEmailSent, updateEmailStatus } from './supabase'

// Configuration du service d'emails (simulation pour le développement)
// En production, vous utiliserez un vrai service comme SendGrid, Mailgun, etc.
interface EmailConfig {
  from: string
  replyTo?: string
  adminEmail?: string // Email de l'administrateur pour les accusés de réception
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

// Simulation d'envoi d'email (remplacer par un vrai service en production)
const sendEmailViaProvider = async (): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  // Simulation de délai d'envoi
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  // Simulation de succès/échec (90% de succès)
  const isSuccess = Math.random() > 0.1
  
  if (isSuccess) {
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  } else {
    return {
      success: false,
      error: 'Erreur de connexion au serveur SMTP'
    }
  }
}

// Fonction pour envoyer un accusé de réception à l'administrateur
export const sendReceiptEmail = async () => {
  if (!emailConfig.adminEmail) {
    console.warn('Email administrateur non configuré')
    return
  }

  try {
    await sendEmailViaProvider()
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

    // 3. Envoyer l'email via le provider
    const result = await sendEmailViaProvider()

    if (result.success) {
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
    } else {
      // 7. Si échec, mettre à jour le statut à "failed"
      await updateEmailStatus(emailRecord.id, 'failed', result.error)
      
      // 8. Envoyer l'accusé d'échec à l'administrateur
      await sendReceiptEmail()
      
      return {
        success: false,
        error: result.error
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
