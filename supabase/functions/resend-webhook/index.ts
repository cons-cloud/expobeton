import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérifier que c'est un webhook Resend
    const signature = req.headers.get('Resend-Signature')
    if (!signature) {
      return new Response('Signature manquante', { status: 401, headers: corsHeaders })
    }

    // Parser le body
    const body = await req.text()
    const webhookData = JSON.parse(body)

    console.log('Webhook Resend reçu:', webhookData)

    // Connexion à Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Traiter différents types d'événements
    switch (webhookData.type) {
      case 'email.delivered':
        await handleEmailDelivered(supabase, webhookData.data)
        break
        
      case 'email.bounced':
        await handleEmailBounced(supabase, webhookData.data)
        break
        
      case 'email.complained':
        await handleEmailComplained(supabase, webhookData.data)
        break
        
      default:
        console.log('Type d\'événement non traité:', webhookData.type)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Erreur webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

async function handleEmailDelivered(supabase: any, data: any) {
  const { email_id, timestamp } = data
  
  try {
    // Mettre à jour le statut dans la base
    const { error } = await supabase
      .from('emails_sent')
      .update({ 
        status: 'delivered',
        delivered_at: new Date(timestamp).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('message_id', email_id)

    if (error) {
      console.error('Erreur mise à jour delivered:', error)
    } else {
      console.log(`Email ${email_id} marqué comme delivered`)
    }

    // Envoyer une notification si nécessaire
    await sendDeliveryNotification(supabase, email_id, 'delivered')

  } catch (error) {
    console.error('Erreur handleEmailDelivered:', error)
  }
}

async function handleEmailBounced(supabase: any, data: any) {
  const { email_id, timestamp, reason } = data
  
  try {
    // Mettre à jour le statut en bounced
    const { error } = await supabase
      .from('emails_sent')
      .update({ 
        status: 'bounced',
        error_message: `Bounce: ${reason}`,
        updated_at: new Date().toISOString()
      })
      .eq('message_id', email_id)

    if (error) {
      console.error('Erreur mise à jour bounced:', error)
    } else {
      console.log(`Email ${email_id} marqué comme bounced: ${reason}`)
    }

    // Envoyer une alerte d'erreur
    await sendDeliveryNotification(supabase, email_id, 'bounced')

  } catch (error) {
    console.error('Erreur handleEmailBounced:', error)
  }
}

async function handleEmailComplained(supabase: any, data: any) {
  const { email_id, timestamp } = data
  
  try {
    // Marquer comme complained (spam)
    const { error } = await supabase
      .from('emails_sent')
      .update({ 
        status: 'bounced',
        error_message: 'Marqué comme spam par le destinataire',
        updated_at: new Date().toISOString()
      })
      .eq('message_id', email_id)

    if (error) {
      console.error('Erreur mise à jour complained:', error)
    } else {
      console.log(`Email ${email_id} marqué comme complained (spam)`)
    }

  } catch (error) {
    console.error('Erreur handleEmailComplained:', error)
  }
}

async function sendDeliveryNotification(supabase: any, emailId: string, status: string) {
  try {
    // Récupérer les détails de l'email
    const { data: email } = await supabase
      .from('emails_sent')
      .select('*')
      .eq('message_id', emailId)
      .single()

    if (!email) return

    // Créer une notification dans la table notifications
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: email.user_id,
        type: status === 'delivered' ? 'success' : 'error',
        title: status === 'delivered' ? '✅ Email livré' : '❌ Échec livraison',
        message: status === 'delivered' 
          ? `Email envoyé à ${email.recipient_email} a été livré avec succès`
          : `Email à ${email.recipient_email} n'a pas pu être livré`,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Erreur création notification:', error)
    }

  } catch (error) {
    console.error('Erreur sendDeliveryNotification:', error)
  }
}
