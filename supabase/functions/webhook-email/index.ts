import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailWebhook {
  id: string
  created_at: string
  from: string
  to: string[]
  subject: string
  html?: string
  text?: string
  reply_to_message_id?: string
  headers?: Record<string, string>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérifier le secret webhook Resend
    const signature = req.headers.get('resend-signature')
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET')
    
    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parser le body
    const body = await req.text()
    let emailData: EmailWebhook

    try {
      emailData = JSON.parse(body)
    } catch (error) {
      console.error('Invalid JSON body:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Email webhook received:', emailData)

    // Initialiser le client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Vérifier si c'est une réponse à un email existant
    let replyToEmailId = null
    if (emailData.reply_to_message_id) {
      const { data: existingEmail } = await supabaseClient
        .from('emails_received')
        .select('id')
        .eq('message_id', emailData.reply_to_message_id)
        .single()
      
      replyToEmailId = existingEmail?.id
    }

    // Insérer l'email reçu dans la base de données
    const { data: insertedEmail, error: insertError } = await supabaseClient
      .from('emails_received')
      .insert({
        from_email: emailData.from,
        to_email: Array.isArray(emailData.to) ? emailData.to[0] : emailData.to,
        subject: emailData.subject,
        content: emailData.html || emailData.text || '',
        message_id: emailData.id,
        reply_to_email_id: replyToEmailId,
        received_at: emailData.created_at,
        status: 'received',
        is_read: false,
        headers: emailData.headers || {}
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting email:', insertError)
      throw new Error(`Database error: ${insertError.message}`)
    }

    console.log('Email inserted successfully:', insertedEmail)

    // Créer une notification pour l'utilisateur
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        title: 'Nouvel email reçu',
        message: `De: ${emailData.from} - ${emailData.subject}`,
        type: 'email_received',
        data: {
          email_id: insertedEmail.id,
          from: emailData.from,
          subject: emailData.subject
        },
        read: false,
        created_at: new Date().toISOString()
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Ne pas échouer si la notification échoue
    }

    // Envoyer une réponse de succès
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email processed successfully',
        email_id: insertedEmail.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
