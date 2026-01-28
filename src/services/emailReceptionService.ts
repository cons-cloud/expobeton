import { supabase } from '../lib/supabase'

interface EmailReceived {
  id: string
  from_email: string
  to_email: string
  subject: string
  body_text: string
  body_html?: string
  message_id: string
  in_reply_to?: string
  references?: string
  created_at: string
  is_read: boolean
}

interface WebhookEmail {
  from: string
  to: string
  subject: string
  text: string
  html?: string
  messageId: string
  inReplyTo?: string
  references?: string
}

// Service de réception d'emails
export class EmailReceptionService {
  // Traiter un email reçu via webhook
  static async processReceivedEmail(webhookData: WebhookEmail): Promise<{ success: boolean; error?: string }> {
    try {
      // Vérifier si c'est une réponse à un email envoyé
      const { data: originalEmail } = await supabase
        .from('emails_sent')
        .select('*')
        .eq('recipient_email', webhookData.from)
        .order('created_at', { ascending: false })
        .limit(1)

      // Enregistrer l'email reçu
      const { data: receivedEmail, error } = await supabase
        .from('emails_received')
        .insert({
          message_id: webhookData.messageId,
          from_email: webhookData.from,
          to_email: webhookData.to,
          subject: webhookData.subject,
          body_text: webhookData.text,
          body_html: webhookData.html,
          in_reply_to: webhookData.inReplyTo,
          references: webhookData.references,
          original_email_sent_id: originalEmail?.[0]?.id,
          is_read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Erreur lors de l'enregistrement: ${error.message}`)
      }

      // Créer une notification
      await supabase
        .from('notifications')
        .insert({
          type: 'email_received',
          title: 'Nouvel email reçu',
          message: `Vous avez reçu un email de ${webhookData.from}`,
          data: {
            email_id: receivedEmail.id,
            from_email: webhookData.from,
            subject: webhookData.subject,
            is_reply: originalEmail && originalEmail.length > 0
          },
          is_important: originalEmail && originalEmail.length > 0,
          is_read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      console.log('Email reçu et traité:', receivedEmail.id)
      return { success: true }

    } catch (error) {
      console.error('Erreur lors du traitement de l\'email reçu:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }
    }
  }

  // Obtenir les emails reçus
  static async getReceivedEmails(): Promise<EmailReceived[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Utilisateur non authentifié')
      }

      const { data, error } = await supabase
        .from('emails_received')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error('Erreur getReceivedEmails:', error)
      throw error
    }
  }

  // Marquer un email comme lu
  static async markAsRead(emailId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('emails_received')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', emailId)

      if (error) {
        throw new Error(error.message)
      }

      // Marquer aussi la notification comme lue
      await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('data->>email_id', emailId)

      return { success: true }
    } catch (error) {
      console.error('Erreur markAsRead:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }
    }
  }

  // Obtenir le nombre d'emails non lus
  static async getUnreadCount(): Promise<number> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return 0
      }

      const { count, error } = await supabase
        .from('emails_received')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)

      if (error) {
        throw new Error(error.message)
      }

      return count || 0
    } catch (error) {
      console.error('Erreur getUnreadCount:', error)
      return 0
    }
  }

  // Supprimer un email reçu
  static async deleteEmail(emailId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('emails_received')
        .delete()
        .eq('id', emailId)

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    } catch (error) {
      console.error('Erreur deleteEmail:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }
    }
  }

  // Répondre à un email reçu
  static async replyToEmail(
    emailId: string, 
    replyText: string, 
    replyHtml?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Récupérer l'email reçu
      const { data: receivedEmail, error: fetchError } = await supabase
        .from('emails_received')
        .select('*')
        .eq('id', emailId)
        .single()

      if (fetchError || !receivedEmail) {
        throw new Error('Email reçu non trouvé')
      }

      // Préparer la réponse
      const replySubject = receivedEmail.subject.startsWith('Re:') 
        ? receivedEmail.subject 
        : `Re: ${receivedEmail.subject}`

      // Envoyer la réponse via Resend
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-email/reply`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            receivedEmailId: emailId,
            replyTo: receivedEmail.from_email,
            subject: replySubject,
            bodyText: replyText,
            bodyHtml: replyHtml
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'envoi de la réponse')
      }

      // Marquer l'email original comme traité
      await this.markAsRead(emailId)

      return { success: true }
    } catch (error) {
      console.error('Erreur replyToEmail:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }
    }
  }
}

export default EmailReceptionService
