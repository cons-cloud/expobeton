import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: string
    type?: string
  }>
}

interface EmailReceived {
  from: string
  to: string
  subject: string
  text: string
  html?: string
  messageId: string
  inReplyTo?: string
  references?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const method = req.method
    const path = url.pathname

    // Initialiser le client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Initialiser Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    // Route pour envoyer un email
    if (method === 'POST') {
      const emailData: EmailRequest = await req.json()
      
      // Configuration de l'expéditeur avec domaine personnalisé
      const fromEmail = emailData.from || Deno.env.get('RESEND_FROM_EMAIL') || 'Expobeton Email <noreply@expobeton.com>'
      
      // Validation des destinataires
      const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to]
      if (recipients.length === 0) {
        throw new Error('Aucun destinataire spécifié')
      }
      
      // Validation du contenu
      if (!emailData.subject || (!emailData.html && !emailData.text)) {
        throw new Error('Sujet et contenu requis')
      }

      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: recipients,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.html?.replace(/<[^>]*>/g, ''), // Fallback text
        replyTo: emailData.replyTo || Deno.env.get('RESEND_REPLY_TO'),
        attachments: emailData.attachments
      })

      if (error) {
        throw new Error(`Erreur Resend: ${error.message}`)
      }

      // Enregistrer l'email envoyé dans la base de données
      const { error: dbError } = await supabaseClient
        .from('emails_sent')
        .insert({
          recipient_email: Array.isArray(emailData.to) ? emailData.to[0] : emailData.to,
          subject: emailData.subject,
          content: emailData.html || emailData.text,
          status: 'sent',
          sent_at: new Date().toISOString(),
          user_id: (await supabaseClient.auth.getUser()).data.user?.id
        })

      if (dbError) {
        console.error('Erreur lors de l\'enregistrement en base:', dbError)
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Route pour recevoir un email (webhook)
    if (method === 'POST' && path === '/receive') {
      const emailData: EmailReceived = await req.json()
      
      // Vérifier si c'est une réponse à un email envoyé
      const { data: originalEmail } = await supabaseClient
        .from('emails_sent')
        .select('*')
        .eq('recipient_email', emailData.from)
        .order('created_at', { ascending: false })
        .limit(1)

      // Enregistrer l'email reçu
      const { data: receivedEmail, error } = await supabaseClient
        .from('emails_received')
        .insert({
          message_id: emailData.messageId,
          from_email: emailData.from,
          to_email: emailData.to,
          subject: emailData.subject,
          body_text: emailData.text,
          body_html: emailData.html,
          in_reply_to: emailData.inReplyTo,
          references: emailData.references,
          original_email_sent_id: originalEmail?.[0]?.id,
          user_id: (await supabaseClient.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Erreur lors de l'enregistrement de l'email reçu: ${error.message}`)
      }

      // Créer une notification
      await supabaseClient
        .from('notifications')
        .insert({
          type: 'email_received',
          title: 'Nouvel email reçu',
          message: `Vous avez reçu un email de ${emailData.from}`,
          data: {
            email_id: receivedEmail.id,
            from_email: emailData.from,
            subject: emailData.subject,
            is_reply: originalEmail?.length > 0
          },
          is_important: originalEmail?.length > 0,
          user_id: (await supabaseClient.auth.getUser()).data.user?.id
        })

      return new Response(
        JSON.stringify({ success: true, emailId: receivedEmail.id }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Route pour envoyer une réponse
    if (method === 'POST' && path === '/reply') {
      const { receivedEmailId, replyTo, subject, bodyText, bodyHtml } = await req.json()
      
      // Récupérer l'email reçu
      const { data: receivedEmail, error: fetchError } = await supabaseClient
        .from('emails_received')
        .select('*')
        .eq('id', receivedEmailId)
        .single()

      if (fetchError || !receivedEmail) {
        throw new Error('Email reçu non trouvé')
      }

      // Envoyer la réponse via Resend
      const { data, error } = await resend.emails.send({
        from: 'Expobeton Email <onboarding@resend.dev>',
        to: [replyTo],
        subject: subject,
        html: bodyHtml,
        text: bodyText,
        replyTo: receivedEmail.to_email,
        inReplyTo: receivedEmail.message_id,
        references: receivedEmail.references
      })

      if (error) {
        throw new Error(`Erreur Resend: ${error.message}`)
      }

      // Enregistrer la réponse
      const { data: replyData, error: replyError } = await supabaseClient
        .from('email_replies')
        .insert({
          received_email_id: receivedEmailId,
          reply_to: replyTo,
          subject: subject,
          body_text: bodyText,
          body_html: bodyHtml,
          status: 'sent',
          sent_at: new Date().toISOString(),
          user_id: (await supabaseClient.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (replyError) {
        throw new Error(`Erreur lors de l'enregistrement de la réponse: ${replyError.message}`)
      }

      // Créer une notification
      await supabaseClient
        .from('notifications')
        .insert({
          type: 'email_replied',
          title: 'Réponse envoyée',
          message: `Votre réponse à ${replyTo} a été envoyée avec succès`,
          data: {
            reply_id: replyData.id,
            received_email_id: receivedEmailId,
            reply_to: replyTo
          },
          user_id: (await supabaseClient.auth.getUser()).data.user?.id
        })

      return new Response(
        JSON.stringify({ success: true, replyId: replyData.id }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Route pour obtenir les statistiques
    if (method === 'GET' && path === '/stats') {
      const userId = (await supabaseClient.auth.getUser()).data.user?.id
      
      // Statistiques des emails envoyés
      const { data: sentStats } = await supabaseClient
        .from('emails_sent')
        .select('status')
        .eq('user_id', userId)

      // Statistiques des emails reçus
      const { data: receivedStats } = await supabaseClient
        .from('emails_received')
        .select('is_read')
        .eq('user_id', userId)

      // Statistiques des notifications
      const { data: notificationStats } = await supabaseClient
        .from('notifications')
        .select('is_read')
        .eq('user_id', userId)

      const stats = {
        sent: {
          total: sentStats?.length || 0,
          delivered: sentStats?.filter(e => e.status === 'delivered').length || 0,
          failed: sentStats?.filter(e => e.status === 'failed').length || 0
        },
        received: {
          total: receivedStats?.length || 0,
          unread: receivedStats?.filter(e => !e.is_read).length || 0,
          read: receivedStats?.filter(e => e.is_read).length || 0
        },
        notifications: {
          total: notificationStats?.length || 0,
          unread: notificationStats?.filter(n => !n.is_read).length || 0
        }
      }

      return new Response(
        JSON.stringify(stats),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Route pour tester la connexion
    if (method === 'GET' && path === '/health') {
      return new Response(
        JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          resend_configured: !!Deno.env.get('RESEND_API_KEY')
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Route non trouvée' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    )

  } catch (error) {
    console.error('Erreur dans la fonction Resend:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
