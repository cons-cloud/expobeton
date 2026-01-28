interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

// URL de l'API d'envoi d'emails (fonction Supabase Resend)
const API_URL = 'https://qzhvjjnoubnhnmiwackh.supabase.co/functions/v1/resend-email';

// Headers pour l'authentification Supabase
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
});

// Email de test autorisé par Resend (mode développement)
const TEST_EMAIL = 'henrinelngando229@gmail.com';

// Vérifier si on est en mode test et adapter le destinataire
const adaptRecipientForTest = (recipient: string | string[]): string | string[] => {
  // En développement, forcer l'utilisation de l'email de test
  if (import.meta.env.DEV || import.meta.env.VITE_MODE === 'development') {
    console.log('Mode développement: redirection vers email de test', TEST_EMAIL);
    return TEST_EMAIL;
  }
  return recipient;
};

export const sendEmail = async (options: SendEmailOptions) => {
  try {
    // Adapter le destinataire pour le mode test
    const adaptedTo = adaptRecipientForTest(options.to);
    
    // Ajouter lien de désabonnement pour améliorer la délivrabilité
    const htmlWithUnsubscribe = options.html + 
      `<br><br><small style="color: #666; font-size: 11px;">
        Si vous ne souhaitez plus recevoir ces emails, 
        <a href="#" style="color: #666;">cliquez ici pour vous désabonner</a>
      </small>`;

    const emailData = {
      ...options,
      to: adaptedTo,
      html: htmlWithUnsubscribe
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Email sent via API:', data.messageId);
    return data;
  } catch (error) {
    console.error('Error sending email via API:', error);
    throw error;
  }
};

export const sendBulkEmails = async (emails: Omit<SendEmailOptions, 'from'>[]) => {
  const results = [];

  try {
    // Pour l'envoi en masse, on envoie les emails un par un
    for (const email of emails) {
      try {
        const result = await sendEmail(email);
        results.push({ success: true, messageId: result.messageId, to: email.to });
        
        // Délai plus long pour respecter la limite de 2 requêtes/seconde de Resend
        await new Promise(resolve => setTimeout(resolve, 600)); // 600ms = ~1.6 req/sec
      } catch (error: unknown) {
        console.error(`Failed to send email to ${email.to}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        results.push({ success: false, error: errorMessage, to: email.to });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Bulk emails sent: ${successCount}/${results.length} emails`);
    
    return { 
      success: successCount > 0, 
      results,
      summary: {
        total: results.length,
        sent: successCount,
        failed: results.length - successCount
      }
    };
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    throw error;
  }
};

// Fonction pour tester la configuration SMTP via l'API
export const testEmailConfig = async () => {
  try {
    const testEmail = {
      to: import.meta.env.VITE_SMTP_USER,
      subject: 'Test de configuration SMTP',
      html: '<p>Ceci est un email de test pour vérifier la configuration SMTP.</p>',
    };

    const result = await sendEmail(testEmail);
    return { success: true, message: 'Configuration SMTP valide', messageId: result.messageId };
  } catch (error: unknown) {
    console.error('SMTP configuration test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return { success: false, error: errorMessage };
  }
};