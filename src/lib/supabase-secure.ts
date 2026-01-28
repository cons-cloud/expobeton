import { createClient } from '@supabase/supabase-js'
import CryptoJS from 'crypto-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Clé de chiffrement (doit être la même que côté serveur)
const ENCRYPTION_KEY = 'votre-clé-secrete-256bits-à-garder-secrète'

// Fonction pour chiffrer les données sensibles
export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
}

// Fonction pour déchiffrer les données sensibles
export const decryptData = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Configuration de sécurité renforcée
    storage: window.localStorage,
    flowType: 'pkce' // Utilisation de PKCE pour plus de sécurité
  },
  // Configuration de sécurité pour les requêtes
  global: {
    headers: {
      'X-Client-Info': 'expobeton-email/1.0.0'
    }
  }
})

// Validation des entrées
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Supprime les caractères HTML dangereux
    .replace(/javascript:/gi, '') // Supprime les protocoles JavaScript
    .slice(0, 1000) // Limite la longueur
}

// Types pour les tables (avec validation)
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

// Fonctions utilitaires avec validation
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }
  return user
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Fonctions pour les emails envoyés (avec validation)
export const createEmailSent = async (emailData: Omit<EmailSent, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
  // Validation des données
  if (!validateEmail(emailData.recipient_email)) {
    throw new Error('Invalid recipient email')
  }
  
  if (!emailData.subject || emailData.subject.length > 200) {
    throw new Error('Invalid subject')
  }
  
  if (!emailData.content || emailData.content.length > 100000) {
    throw new Error('Invalid content')
  }

  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // Sanitization des données
  const sanitizedData = {
    ...emailData,
    recipient_email: sanitizeInput(emailData.recipient_email),
    recipient_name: emailData.recipient_name ? sanitizeInput(emailData.recipient_name) : undefined,
    subject: sanitizeInput(emailData.subject),
    content: sanitizeInput(emailData.content),
    user_id: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('emails_sent')
    .insert(sanitizedData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateEmailStatus = async (emailId: string, status: EmailSent['status'], errorMessage?: string) => {
  // Validation de l'ID
  if (!emailId || emailId.length !== 36) {
    throw new Error('Invalid email ID')
  }

  const updateData: Partial<EmailSent> = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === 'sent') {
    updateData.sent_at = new Date().toISOString()
  } else if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString()
  }

  if (errorMessage && errorMessage.length <= 1000) {
    updateData.error_message = sanitizeInput(errorMessage)
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
    .limit(1000) // Limite pour éviter les attaques

  if (campaignId && campaignId.length === 36) {
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

  if (campaignId && campaignId.length === 36) {
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
