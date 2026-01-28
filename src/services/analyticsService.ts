import { supabase } from '../lib/supabase'

interface AnalyticsData {
  total_campaigns: number
  total_contacts: number
  total_emails_sent: number
  total_emails_received: number
  open_rate: number
  click_rate: number
  recent_activity: Array<{
    type: 'email_sent' | 'email_received' | 'campaign_created'
    message: string
    timestamp: string
  }>
  email_stats: {
    sent_today: number
    sent_this_week: number
    received_today: number
    received_this_week: number
  }
}

export class AnalyticsService {
  // Obtenir toutes les statistiques en temps réel
  static async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      const [
        campaignsResult,
        contactsResult,
        emailsSentResult,
        emailsReceivedResult
      ] = await Promise.all([
        supabase.from('campaigns').select('*'),
        supabase.from('contacts').select('*'),
        supabase.from('emails_sent').select('*'),
        supabase.from('emails_received').select('*')
      ])

      const campaigns = campaignsResult.data || []
      const contacts = contactsResult.data || []
      const emailsSent = emailsSentResult.data || []
      const emailsReceived = emailsReceivedResult.data || []

      // Calculer les taux
      const totalSent = emailsSent.length
      const totalOpened = emailsSent.filter(e => e.status === 'opened').length
      const totalClicked = emailsSent.filter(e => e.status === 'clicked').length
      
      const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0
      const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0

      // Calculer les statistiques récentes
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const emailStats = {
        sent_today: emailsSent.filter(e => new Date(e.created_at) >= today).length,
        sent_this_week: emailsSent.filter(e => new Date(e.created_at) >= weekAgo).length,
        received_today: emailsReceived.filter(e => new Date(e.received_at) >= today).length,
        received_this_week: emailsReceived.filter(e => new Date(e.received_at) >= weekAgo).length
      }

      // Activité récente
      const recent_activity = [
        ...emailsSent.slice(0, 3).map(email => ({
          type: 'email_sent' as const,
          message: `Email envoyé à ${email.recipient_email}`,
          timestamp: email.created_at
        })),
        ...emailsReceived.slice(0, 3).map(email => ({
          type: 'email_received' as const,
          message: `Email reçu de ${email.from_email}`,
          timestamp: email.received_at
        })),
        ...campaigns.slice(0, 2).map(campaign => ({
          type: 'campaign_created' as const,
          message: `Campagne "${campaign.name}" créée`,
          timestamp: campaign.created_at
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)

      return {
        total_campaigns: campaigns.length,
        total_contacts: contacts.length,
        total_emails_sent: totalSent,
        total_emails_received: emailsReceived.length,
        open_rate: openRate,
        click_rate: clickRate,
        recent_activity,
        email_stats: emailStats
      }
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error)
      return this.getDefaultData()
    }
  }

  // Données par défaut en cas d'erreur
  private static getDefaultData(): AnalyticsData {
    return {
      total_campaigns: 0,
      total_contacts: 0,
      total_emails_sent: 0,
      total_emails_received: 0,
      open_rate: 0,
      click_rate: 0,
      recent_activity: [],
      email_stats: {
        sent_today: 0,
        sent_this_week: 0,
        received_today: 0,
        received_this_week: 0
      }
    }
  }

  // Écouter les changements en temps réel
  static subscribeToChanges(callback: (data: AnalyticsData) => void) {
    // Écouter les changements sur toutes les tables pertinentes
    const channels = [
      supabase.channel('campaigns_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'campaigns' },
          () => this.getAnalyticsData().then(callback)
        ),
      supabase.channel('contacts_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'contacts' },
          () => this.getAnalyticsData().then(callback)
        ),
      supabase.channel('emails_sent_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'emails_sent' },
          () => this.getAnalyticsData().then(callback)
        ),
      supabase.channel('emails_received_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'emails_received' },
          () => this.getAnalyticsData().then(callback)
        )
    ]

    // S'abonner à tous les canaux
    channels.forEach(channel => channel.subscribe())

    // Retourner une fonction de cleanup
    return () => {
      channels.forEach(channel => channel.unsubscribe())
    }
  }
}

export default AnalyticsService
