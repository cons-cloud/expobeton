import { supabase } from './supabase'

export interface EmailReceived {
  id: string
  message_id: string
  thread_id?: string
  from_email: string
  from_name?: string
  to_email: string
  subject: string
  body_text?: string
  body_html?: string
  attachments?: any[]
  received_at: string
  is_read: boolean
  is_starred: boolean
  is_archived: boolean
  folder: string
  labels: string[]
  original_email_sent_id?: string
}

export interface Notification {
  id: string
  type: 'email_received' | 'email_replied' | 'campaign_update' | 'system'
  title: string
  message: string
  data: any
  is_read: boolean
  is_important: boolean
  created_at: string
  time_category: 'new' | 'recent' | 'old'
}

export interface EmailReply {
  id: string
  received_email_id: string
  reply_to: string
  reply_cc?: string
  reply_bcc?: string
  subject: string
  body_text: string
  body_html?: string
  status: 'draft' | 'sending' | 'sent' | 'failed'
  sent_at?: string
  error_message?: string
}

export class EmailReceptionService {
  // Recevoir un nouvel email
  static async receiveEmail(emailData: {
    message_id: string
    from_email: string
    from_name?: string
    to_email: string
    subject: string
    body_text?: string
    body_html?: string
    in_reply_to?: string
    thread_id?: string
    attachments?: any[]
  }) {
    try {
      const { data, error } = await supabase.rpc('receive_email', {
        p_message_id: emailData.message_id,
        p_from_email: emailData.from_email,
        p_from_name: emailData.from_name || '',
        p_to_email: emailData.to_email,
        p_subject: emailData.subject,
        p_body_text: emailData.body_text,
        p_body_html: emailData.body_html,
        p_in_reply_to: emailData.in_reply_to,
        p_thread_id: emailData.thread_id,
        p_attachments: emailData.attachments || []
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors de la réception de l\'email:', error)
      throw error
    }
  }

  // Obtenir les emails de la boîte de réception
  static async getInboxEmails(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('inbox_view')
        .select('*')
        .order('received_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors de la récupération des emails:', error)
      throw error
    }
  }

  // Obtenir les notifications
  static async getNotifications(limit = 20, unreadOnly = false) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('is_important', { ascending: false })
        .order('is_read', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error)
      throw error
    }
  }

  // Marquer un email comme lu
  static async markAsRead(emailId: string) {
    try {
      const { data, error } = await supabase.rpc('mark_email_as_read', {
        p_email_id: emailId
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error)
      throw error
    }
  }

  // Créer une réponse à un email
  static async createReply(replyData: {
    received_email_id: string
    reply_to: string
    subject: string
    body_text: string
    body_html?: string
  }) {
    try {
      const { data, error } = await supabase.rpc('create_email_reply', {
        p_received_email_id: replyData.received_email_id,
        p_reply_to: replyData.reply_to,
        p_subject: replyData.subject,
        p_body_text: replyData.body_text,
        p_body_html: replyData.body_html
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors de la création de la réponse:', error)
      throw error
    }
  }

  // Envoyer une réponse
  static async sendReply(replyId: string) {
    try {
      // Récupérer les détails de la réponse
      const { data: reply, error: fetchError } = await supabase
        .from('email_replies')
        .select('*')
        .eq('id', replyId)
        .single()

      if (fetchError) throw fetchError

      // Mettre à jour le statut
      const { error: updateError } = await supabase
        .from('email_replies')
        .update({
          status: 'sending',
          sent_at: new Date().toISOString()
        })
        .eq('id', replyId)

      if (updateError) throw updateError

      // TODO: Intégrer avec le service d'envoi d'emails existant
      // Pour l'instant, nous simulons l'envoi
      setTimeout(async () => {
        await supabase
          .from('email_replies')
          .update({
            status: 'sent'
          })
          .eq('id', replyId)
      }, 2000)

      return reply
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error)
      throw error
    }
  }

  // Obtenir les statistiques de réception
  static async getReceptionStats() {
    try {
      const { data, error } = await supabase
        .from('email_reception_stats')
        .select('*')

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }
  }

  // Marquer une notification comme lue
  static async markNotificationAsRead(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error)
      throw error
    }
  }

  // Mettre à jour le statut d'un email (starred, archived, etc.)
  static async updateEmailStatus(emailId: string, updates: {
    is_starred?: boolean
    is_archived?: boolean
    folder?: string
    labels?: string[]
  }) {
    try {
      const { data, error } = await supabase
        .from('emails_received')
        .update(updates)
        .eq('id', emailId)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de l\'email:', error)
      throw error
    }
  }

  // Supprimer un email
  static async deleteEmail(emailId: string) {
    try {
      const { data, error } = await supabase
        .from('emails_received')
        .delete()
        .eq('id', emailId)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'email:', error)
      throw error
    }
  }

  // Obtenir les réponses pour un email reçu
  static async getRepliesForEmail(receivedEmailId: string) {
    try {
      const { data, error } = await supabase
        .from('email_replies')
        .select('*')
        .eq('received_email_id', receivedEmailId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors de la récupération des réponses:', error)
      throw error
    }
  }
}
