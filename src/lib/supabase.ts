import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Types pour les tables
export type EmailTemplate = {
  id: string
  name: string
  subject: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
}

export type Contact = {
  id: string
  email: string
  first_name?: string
  last_name?: string
  company?: string
  created_at: string
  updated_at: string
  user_id: string
}

export type EmailCampaign = {
  id: string
  name: string
  subject: string
  content: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  scheduled_at?: string
  sent_at?: string
  created_at: string
  updated_at: string
  user_id: string
  template_id?: string
}

export type EmailSent = {
  id: string
  campaign_id?: string
  recipient_email: string
  recipient_name?: string
  subject: string
  content: string
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
  sent_at?: string
  delivered_at?: string
  error_message?: string
  created_at: string
  updated_at: string
  user_id: string
}

// Fonctions utilitaires
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Fonctions pour les emails envoyés
export const createEmailSent = async (emailData: Omit<EmailSent, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('emails_sent')
    .insert({
      ...emailData,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateEmailStatus = async (emailId: string, status: EmailSent['status'], errorMessage?: string) => {
  const updateData: Partial<EmailSent> = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === 'sent') {
    updateData.sent_at = new Date().toISOString()
  } else if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString()
  }

  if (errorMessage) {
    updateData.error_message = errorMessage
  }

  const { data, error } = await supabase
    .from('emails_sent')
    .update(updateData)
    .eq('id', emailId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getEmailsSent = async (campaignId?: string) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  let query = supabase
    .from('emails_sent')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (campaignId) {
    query = query.eq('campaign_id', campaignId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getEmailStats = async (campaignId?: string) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  let query = supabase
    .from('emails_sent')
    .select('status')
    .eq('user_id', user.id)

  if (campaignId) {
    query = query.eq('campaign_id', campaignId)
  }

  const { data, error } = await query
  if (error) throw error

  const stats = {
    total: data.length,
    sent: data.filter(e => e.status === 'sent').length,
    delivered: data.filter(e => e.status === 'delivered').length,
    failed: data.filter(e => e.status === 'failed').length,
    bounced: data.filter(e => e.status === 'bounced').length,
    pending: data.filter(e => e.status === 'pending').length
  }

  return stats
}