// supabase/functions/send-email/index.ts
/// <reference path="./deno.d.ts" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createTransport } from 'https://deno.land/x/nodemailer@v1.0.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

interface EmailRequest {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

// Validation des paramètres d'entrée
const validateEmailRequest = (body: unknown): EmailRequest => {
  if (!body || typeof body !== 'object') {
    throw new Error('Le corps de la requête est vide ou invalide')
  }

  const emailBody = body as Record<string, unknown>
  const { to, subject, html, text, from } = emailBody

  if (!to) {
    throw new Error('Le destinataire (to) est requis')
  }

  if (!subject) {
    throw new Error('Le sujet (subject) est requis')
  }

  if (!html && !text) {
    throw new Error('Le contenu (html ou text) est requis')
  }

  return { to, subject, html, text, from } as EmailRequest
}

// Configuration du transport SMTP avec validation
const createSMTPTransporter = () => {
  const smtpHost = Deno.env.get('SMTP_HOST')
  const smtpPort = Deno.env.get('SMTP_PORT')
  const smtpUser = Deno.env.get('SMTP_USER')
  const smtpPass = Deno.env.get('SMTP_PASS')
  const smtpSecure = Deno.env.get('SMTP_SECURE')

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('Configuration SMTP manquante. Vérifiez les variables d\'environnement.')
  }

  console.log(`Configuration SMTP: ${smtpHost}:${smtpPort || '587'}, User: ${smtpUser}`)

  return createTransport({
    host: smtpHost,
    port: parseInt(smtpPort || '587'),
    secure: smtpSecure === 'true',
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  })
}

serve(async (req: Request) => {
  console.log(`Requête reçue: ${req.method} ${req.url}`)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    })
  }

  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: 'Méthode non autorisée. Utilisez POST.' 
    }), {
      headers: { ...corsHeaders },
      status: 405,
    })
  }

  try { 
    // Parser et valider le corps de la requête
    let body: unknown
    try {
      body = await req.json()
    } catch {
      throw new Error('JSON invalide dans le corps de la requête')
    }

    const emailData = validateEmailRequest(body)
    console.log(`Email à envoyer: ${emailData.subject} -> ${emailData.to}`)
    
    // Créer le transporteur et envoyer l'email
    const transporter = createSMTPTransporter()

    const mailOptions = {
      from: emailData.from || `"Expobeton" <${Deno.env.get('SMTP_USER')}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text || emailData.html.replace(/<[^>]*>?/gm, ''),
      html: emailData.html
    }

    console.log('Tentative d\'envoi d\'email...')
    const info = await transporter.sendMail(mailOptions)
    
    console.log(`Email envoyé avec succès: ${info.messageId}`)
    
    return new Response(JSON.stringify({ 
      success: true, 
      messageId: info.messageId,
      to: emailData.to,
      subject: emailData.subject
    }), {
      headers: { ...corsHeaders },
      status: 200,
    })

  } catch (error: unknown) {
    console.error('Erreur lors de l\'envoi d\'email:', error)
    
    let errorMessage = 'Erreur interne du serveur'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false
    }), {
      headers: { ...corsHeaders },
      status: 500,
    })
  }
})
