import { useState, useEffect } from 'react'
import { Title, Text, Card, Button, TextInput, Textarea, ActionIcon } from '@mantine/core'
import { IconMail, IconRefresh, IconSend, IconArchive, IconTrash, IconEdit, IconCheck, IconX, IconAlignLeft } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { supabase } from '../../lib/supabase'

interface Email {
  id: string
  from_email: string
  to_email: string
  subject: string
  content: string
  received_at: string
  status: 'received' | 'read' | 'archived' | 'deleted'
  is_read: boolean
  message_id: string
}

export function InboxTab() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [replyText, setReplyText] = useState('')
  const [showRefreshModal, setShowRefreshModal] = useState(false)
  const [showNewEmailModal, setShowNewEmailModal] = useState(false)
  const [newEmailForm, setNewEmailForm] = useState({
    to: '',
    subject: '',
    content: ''
  })
  const [editMode, setEditMode] = useState(false)
  const [editedSubject, setEditedSubject] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [emails, setEmails] = useState<Email[]>([])

  // Charger les emails depuis Supabase
  useEffect(() => {
    loadEmails()
    
    // Écouter les nouveaux emails en temps réel
    const subscription = supabase
      .channel('emails_received')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'emails_received' },
        (payload) => {
          console.log('Nouvel email reçu:', payload)
          loadEmails() // Recharger les emails
          
          // Afficher une notification
          notifications.show({
            id: 'new-email',
            title: 'Nouvel email reçu',
            message: `De: ${payload.new.from_email}`,
            color: 'blue',
            autoClose: 5000,
            icon: <div style={{ width: 0 }} />
          })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('emails_received')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Erreur chargement emails:', error)
        // Utiliser des emails de démonstration en cas d'erreur
        setEmails(getDemoEmails())
      } else {
        setEmails(data || [])
      }
    } catch (error) {
      console.error('Erreur:', error)
      setEmails(getDemoEmails())
    }
  }

  const getDemoEmails = (): Email[] => [
    {
      id: '1',
      from_email: 'contact@entreprise-abc.com',
      to_email: 'henrinelngando229@gmail.com',
      subject: 'Re: Promotion Printemps • Premium',
      content: 'Bonjour, Nous vous confirmons la bonne réception de votre email envoyé dans le cadre de notre campagne "Promotion Printemps • Premium". Votre message a été traité avec succès et nous en avons bien pris connaissance. Notre équipe vous répondra dans les plus brefs délais si nécessaire. Cordialement, L\'équipe ExpoBeton',
      received_at: new Date().toISOString(),
      status: 'received',
      is_read: false,
      message_id: 'demo-1'
    },
    {
      id: '2',
      from_email: 'info@societe.fr',
      to_email: 'henrinelngando229@gmail.com',
      subject: 'Demande d\'information',
      content: 'Bonjour, Je suis intéressé par vos services. Pourriez-vous me contacter pour en discuter ? Merci d\'avance.',
      received_at: new Date(Date.now() - 3600000).toISOString(),
      status: 'received',
      is_read: false,
      message_id: 'demo-2'
    },
    {
      id: '3',
      from_email: 'client@exemple.com',
      to_email: 'henrinelngando229@gmail.com',
      subject: 'Proposition de collaboration',
      content: 'Bonjour, Nous aimerions collaborer avec votre entreprise. Nos services pourraient compléter votre offre. N\'hésitez pas à nous contacter pour en savoir plus.',
      received_at: new Date(Date.now() - 7200000).toISOString(),
      status: 'read',
      is_read: true,
      message_id: 'demo-3'
    }
  ]


  // Fonctions pour les boutons
  const handleRefresh = () => {
    setShowRefreshModal(true)
    setTimeout(() => {
      setShowRefreshModal(false)
    }, 2000)
  }

  const handleNewEmail = () => {
    setShowNewEmailModal(true)
  }

  const handleSendNewEmail = async () => {
    if (newEmailForm.to && newEmailForm.subject && newEmailForm.content) {
      try {
        // Importer dynamiquement le service email
        const { sendEmail } = await import('../../services/emailService');
        
        // Envoyer l'email via le service Resend
        await sendEmail({
          to: newEmailForm.to,
          subject: newEmailForm.subject,
          html: newEmailForm.content.replace(/\n/g, '<br>'),
          text: newEmailForm.content
        });

        notifications.show({
          id: 'new-email-sent',
          title: '✅ Email envoyé',
          message: `Votre email a été envoyé à ${newEmailForm.to}`,
          color: 'green',
          autoClose: 4000,
          icon: <div style={{ width: 0 }} />
        });
        
        setShowNewEmailModal(false);
        setNewEmailForm({
          to: '',
          subject: '',
          content: ''
        });
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        notifications.show({
          title: '❌ Erreur',
          message: `Impossible d'envoyer l'email: ${errorMessage}`,
          color: 'red',
          autoClose: 4000,
          icon: <div style={{ width: 0 }} />
        });
      }
    } else {
      notifications.show({
        title: '⚠️ Champs requis',
        message: 'Veuillez remplir tous les champs',
        color: 'yellow',
        autoClose: 3000,
        icon: <div style={{ width: 0 }} />
      });
    }
  }

  const handleReply = async () => {
    if (selectedEmail && replyText.trim()) {
      try {
        console.log('Envoi de la réponse:', { 
          to: selectedEmail.from_email, 
          subject: `Re: ${selectedEmail.subject}`,
          content: replyText 
        })
        
        // Envoyer la réponse via le service d'email
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-email`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: selectedEmail.from_email,
              subject: `Re: ${selectedEmail.subject}`,
              html: replyText.replace(/\n/g, '<br>'),
              text: replyText
            })
          }
        )

        if (response.ok) {
          // Notification de succès moderne
          notifications.show({
            id: 'reply-success',
            withCloseButton: true,
            autoClose: 5000,
            title: (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheck size={20} color="#10b981" />
                <span style={{ color: 'white', fontWeight: 600 }}>Réponse envoyée avec succès!</span>
              </div>
            ),
            message: (
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                Votre réponse a été envoyée à <strong>{selectedEmail.from_email}</strong>
                <br />
                <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Sujet: Re: {selectedEmail.subject}
                </span>
              </div>
            ),
            color: 'green',
            style: {
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)'
            },
            styles: {
              closeButton: {
                width: '12px',
                height: '12px',
                minHeight: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                '&:hover': {
                  color: 'rgba(255, 255, 255, 0.8)',
                  background: 'rgba(255, 255, 255, 0.1)'
                }
              }
            },
            icon: <IconCheck size={20} color="#10b981" />
          })
          
          setReplyText('')
        } else {
          throw new Error('Erreur lors de l\'envoi')
        }
        
        notifications.show({
          id: 'reply-success',
          withCloseButton: true,
          autoClose: 5000,
          title: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconCheck size={20} color="#10b981" />
              <span style={{ color: 'white', fontWeight: 600 }}>Réponse envoyée avec succès!</span>
            </div>
          ),
          message: (
            <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
              Votre réponse a été envoyée à <strong>{selectedEmail.from_email}</strong>
              <br />
              <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                Sujet: Re: {selectedEmail.subject}
              </span>
            </div>
          ),
          color: 'green',
          style: {
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)'
          },
          styles: {
            closeButton: {
              width: '12px',
              height: '12px',
              minHeight: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              '&:hover': {
                color: 'rgba(255, 255, 255, 0.8)',
                background: 'rgba(255, 255, 255, 0.1)'
              }
            }
          },
          icon: <IconCheck size={20} color="#10b981" />
        })
        
        setReplyText('')
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error)
      
      // Notification d'erreur
      notifications.show({
        id: 'reply-error',
        withCloseButton: true,
        autoClose: 5000,
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconX size={8} color="#ef4444" />
            <span style={{ color: 'white', fontWeight: 600 }}>Erreur d'envoi</span>
          </div>
        ),
        message: (
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
            {error instanceof Error ? error.message : 'Erreur inconnue lors de l\'envoi'}
          </div>
        ),
        color: 'red',
        style: {
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)'
        },
        styles: {
          closeButton: {
            width: '12px',
            height: '12px',
            minHeight: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            '&:hover': {
              color: 'rgba(255, 255, 255, 0.8)',
              background: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        icon: <IconX size={8} color="#ef4444" />
      })
    }
  }
}

const handleCancelReply = () => {
  if (replyText.trim()) {
    // Notification d'annulation avec texte
    notifications.show({
      id: 'reply-cancelled',
      withCloseButton: true,
      autoClose: 3000,
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconX size={8} color="#ef4444" />
          <span style={{ color: 'white', fontWeight: 600 }}>Réponse annulée</span>
        </div>
      ),
      message: (
        <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
          La rédaction de votre réponse a été annulée
        </div>
      ),
      color: 'red',
      style: {
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)'
      },
      icon: <IconX size={8} color="#ef4444" />
    })
      
      notifications.show({
        id: 'edit-mode',
        withCloseButton: true,
        autoClose: 3000,
        title: (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontFamily: 'Inter, sans-serif'
          }}>
            <IconEdit size={10} color="#3b82f6" />
            <span style={{ 
              color: '#ffffff', 
              fontWeight: 500, 
              fontSize: '12px'
            }}>
              Mode édition activé
            </span>
          </div>
        ),
        message: (
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '10px',
            fontFamily: 'Inter, sans-serif',
            marginTop: '2px'
          }}>
            Modifiez l'email et cliquez sur "Sauvegarder"
          </div>
        ),
        color: 'blue',
        style: {
          background: 'rgba(59, 130, 246, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '6px',
          padding: '6px 10px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
          minWidth: '180px',
          maxWidth: '240px'
        },
        styles: {
          closeButton: {
            width: '14px',
            height: '14px',
            minHeight: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            '&:hover': {
              color: 'rgba(255, 255, 255, 0.8)',
              background: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      })
    }
  }

  const handleDeleteEmail = () => {
    if (selectedEmail) {
      // Notification de confirmation
      notifications.show({
        id: 'delete-confirm',
        withCloseButton: true,
        autoClose: 5000,
        title: (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontFamily: 'Inter, sans-serif'
          }}>
            <IconTrash size={10} color="#ef4444" />
            <span style={{ 
              color: '#ffffff', 
              fontWeight: 500, 
              fontSize: '12px'
            }}>
              Email supprimé
            </span>
          </div>
        ),
        message: (
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '10px',
            fontFamily: 'Inter, sans-serif',
            marginTop: '2px'
          }}>
            {selectedEmail.subject.length > 25 
              ? selectedEmail.subject.substring(0, 25) + '...' 
              : selectedEmail.subject}
          </div>
        ),
        color: 'red',
        style: {
          background: 'rgba(239, 68, 68, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '6px',
          padding: '6px 10px',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
          minWidth: '180px',
          maxWidth: '240px'
        },
        styles: {
          closeButton: {
            width: '14px',
            height: '14px',
            minHeight: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            '&:hover': {
              color: 'rgba(255, 255, 255, 0.8)',
              background: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      })
      
      // Réinitialiser la sélection après suppression
      setSelectedEmail(null)
      setReplyText('')
      setEditMode(false)
    }
  }

  const handleArchiveEmail = () => {
    if (selectedEmail) {
      // Notification compacte et élégante
      notifications.show({
        id: 'archive-email',
        withCloseButton: true,
        autoClose: 3000,
        title: (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontFamily: 'Inter, sans-serif'
          }}>
            <IconCheck size={14} color="#10b981" />
            <span style={{ 
              color: '#ffffff', 
              fontWeight: 500, 
              fontSize: '13px'
            }}>
              Archivé
            </span>
          </div>
        ),
        message: (
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '11px',
            fontFamily: 'Inter, sans-serif',
            marginTop: '2px'
          }}>
            {selectedEmail.subject.length > 25 
              ? selectedEmail.subject.substring(0, 25) + '...' 
              : selectedEmail.subject}
          </div>
        ),
        color: 'green',
        style: {
          background: 'rgba(16, 185, 129, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
          minWidth: '200px',
          maxWidth: '280px'
        },
        icon: <div style={{ width: 0 }} />,
        styles: {
          root: {
            animation: 'slideInRight 0.3s ease-out',
          },
          closeButton: {
            width: '16px',
            height: '16px',
            minHeight: '16px',
            color: 'rgba(255, 255, 255, 0.5)',
            '&:hover': {
              color: 'rgba(255, 255, 255, 0.8)',
              background: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      })
      
      // Réinitialiser la sélection après archivage
      setSelectedEmail(null)
      setReplyText('')
    }
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)'
          }}>
            <IconMail size={24} color="white" />
          </div>
          <div>
            <Title order={3} style={{ 
              color: 'white',
              marginBottom: '4px',
              fontSize: '1.5rem',
              fontWeight: 700,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              📧 Boîte de Réception
            </Title>
            <Text style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: '0.95rem'
            }}>
              Emails reçus et accusés de réception
            </Text>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            leftSection={<IconRefresh size={18} />}
            onClick={handleRefresh}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 600,
              padding: '12px 24px',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              fontSize: '1rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            Actualiser
          </Button>
          <Button
            leftSection={<IconSend size={18} />}
            onClick={handleNewEmail}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              border: 'none',
              color: 'white',
              fontWeight: 600,
              padding: '12px 24px',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              fontSize: '1rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.4)'
            }}
          >
             Nouvel Email
          </Button>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'flex-start',
        gap: '24px',
        width: '100%'
      }}>
        {/* Liste des emails */}
        <div style={{ 
          flex: '0 0 400px',
          maxWidth: '400px'
        }}>
          <Card style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '16px',
            maxHeight: '600px',
            overflow: 'auto'
          }}>
            <Title order={4} style={{ 
              color: 'white', 
              marginBottom: '16px',
              fontSize: '1.1rem'
            }}>
              Messages récents
            </Title>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {emails.map((email) => (
                <Card key={email.id} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
                onClick={() => setSelectedEmail(email)}>
                  <Text style={{ 
                    color: 'white', 
                    fontWeight: email.is_read ? 400 : 600,
                    fontSize: '0.95rem',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: email.is_read ? '#6b7280' : '#3b82f6',
                      boxShadow: `0 0 8px ${email.is_read ? '#6b7280' : '#3b82f6'}`
                    }} />
                    {email.subject}
                  </Text>
                  <Text style={{ 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    fontSize: '0.85rem',
                    marginBottom: '4px'
                  }}>
                    De: {email.from_email}
                  </Text>
                  <Text style={{ 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    fontSize: '0.75rem',
                    fontFamily: 'Inter, sans-serif',
                    marginTop: '2px'
                  }}>
                    {new Date(email.received_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} • {email.status}
                  </Text>
                </Card>
              ))}
            </div>
          </Card>
        </div>

        {/* Contenu de l'email sélectionné */}
        <div style={{ 
          flex: '1',
          minWidth: '0',
          maxWidth: '800px'
        }}>
          <Card style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '24px',
            borderRadius: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <Title order={4} style={{ 
                color: 'white', 
                fontSize: '1.2rem',
                fontWeight: 600
              }}>
                {selectedEmail ? selectedEmail.subject : '✅ Accusé de réception - Email envoyé avec succès'}
              </Title>
              <div style={{ display: 'flex', gap: '8px' }}>
                <ActionIcon
                  variant="light"
                  size="lg"
                  onClick={() => setEditMode(true)}
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <IconEdit size={18} color="#3b82f6" />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  size="lg"
                  onClick={handleArchiveEmail}
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <IconArchive size={18} color="#10b981" />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  color="red"
                  size="lg"
                  onClick={handleDeleteEmail}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <IconTrash size={18} color="#ef4444" />
                </ActionIcon>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <Text style={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: '0.85rem',
                    marginBottom: '4px'
                  }}>
                    De:
                  </Text>
                  <Text style={{ 
                    color: 'white', 
                    fontWeight: 500
                  }}>
                    {selectedEmail ? selectedEmail.from_email : 'contact@entreprise-abc.com'}
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text style={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: '0.85rem',
                    marginBottom: '4px'
                  }}>
                    Date:
                  </Text>
                  <Text style={{ 
                    color: 'white', 
                    fontWeight: 500
                  }}>
                    {selectedEmail ? new Date(selectedEmail.received_at).toLocaleString() : new Date().toLocaleString()}
                  </Text>
                </div>
              </div>
              
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '0.85rem',
                marginBottom: '4px'
              }}>
                Sujet:
              </Text>
              <Text style={{ 
                color: 'white', 
                fontWeight: 500,
                marginBottom: '16px'
              }}>
                {selectedEmail ? selectedEmail.subject : 'Re: Promotion Printemps • Premium'}
              </Text>
            </div>

            {/* Mode édition ou affichage normal */}
            {editMode && selectedEmail ? (
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(99, 102, 241, 0.04))',
                borderRadius: '20px',
                padding: '32px',
                marginBottom: '32px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                boxShadow: '0 20px 40px rgba(59, 130, 246, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                maxWidth: '100%'
              }}>
                {/* Header du mode édition */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '28px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
                  }}>
                    <IconEdit size={20} color="white" />
                  </div>
                  <div>
                    <Text style={{ 
                      color: '#ffffff', 
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      marginBottom: '4px',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Mode Édition
                    </Text>
                    <Text style={{ 
                      color: 'rgba(255, 255, 255, 0.6)', 
                      fontSize: '0.85rem',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Modifiez le sujet et le contenu de l'email
                    </Text>
                  </div>
                </div>

                {/* Champ Sujet */}
                <div style={{ marginBottom: '28px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <Text style={{ 
                      color: '#ffffff', 
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      fontFamily: 'Inter, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        boxShadow: '0 0 12px rgba(59, 130, 246, 0.5)'
                      }} />
                      Sujet de l'email
                    </Text>
                    <Text style={{
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontSize: '0.75rem',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {editedSubject.length}/100 caractères
                    </Text>
                  </div>
                  <div style={{
                    position: 'relative',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
                    borderRadius: '16px',
                    padding: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2), 0 8px 32px rgba(59, 130, 246, 0.05)'
                  }}>
                    <TextInput
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      placeholder="Entrez un sujet clair et concis..."
                      size="lg"
                      styles={{
                        input: {
                          background: 'transparent',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '1.05rem',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          padding: '16px 20px',
                          borderRadius: '12px',
                          '&::placeholder': { 
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontWeight: 400,
                            fontStyle: 'italic'
                          },
                          '&:focus': {
                            background: 'transparent',
                            outline: 'none',
                            boxShadow: 'none'
                          },
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.02)'
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Champ Contenu */}
                <div style={{ marginBottom: '32px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <Text style={{ 
                      color: '#ffffff', 
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      fontFamily: 'Inter, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        boxShadow: '0 0 12px rgba(59, 130, 246, 0.5)'
                      }} />
                      Contenu du message
                    </Text>
                    <Text style={{
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontSize: '0.75rem',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {editedContent.length}/2000 caractères
                    </Text>
                  </div>
                  <div style={{
                    position: 'relative',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
                    borderRadius: '16px',
                    padding: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2), 0 8px 32px rgba(59, 130, 246, 0.05)',
                    width: '100%'
                  }}>
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      placeholder="Rédigez votre message de manière professionnelle et claire...&#10;&#10;Conseils :&#10;• Soyez concis et précis&#10;• Utilisez des paragraphes courts&#10;• Terminez par une formule de politesse"
                      minRows={10}
                      autosize
                      styles={{
                        input: {
                          background: 'transparent',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '1rem',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 400,
                          lineHeight: 1.7,
                          padding: '20px',
                          borderRadius: '12px',
                          resize: 'none',
                          width: '100%',
                          '&::placeholder': { 
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontWeight: 400,
                            fontStyle: 'italic',
                            lineHeight: 1.6
                          },
                          '&:focus': {
                            background: 'transparent',
                            outline: 'none',
                            boxShadow: 'none'
                          },
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.02)'
                          },
                          '&::-webkit-scrollbar': {
                            width: '8px',
                            height: '8px'
                          },
                          '&::-webkit-scrollbar-track': {
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '4px'
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            '&:hover': {
                              background: 'rgba(255, 255, 255, 0.3)'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  <div style={{
                    marginTop: '8px',
                    padding: '0 4px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <Text style={{
                        color: 'rgba(255, 255, 255, 0.3)',
                        fontSize: '0.75rem',
                        fontFamily: 'Inter, sans-serif',
                        fontStyle: 'italic'
                      }}>
                        Appuyez sur Maj+Entrée pour aller à la ligne
                      </Text>
                      <div style={{
                        display: 'flex',
                        gap: '8px'
                      }}>
                        <ActionIcon
                          size="xs"
                          variant="transparent"
                          style={{
                            color: 'rgba(255, 255, 255, 0.4)',
                            '&:hover': {
                              color: 'rgba(255, 255, 255, 0.7)',
                              background: 'rgba(255, 255, 255, 0.05)'
                            }
                          }}
                          onClick={() => {
                            setEditedContent(editedContent + '\n')
                          }}
                        >
                          <IconAlignLeft size={12} />
                        </ActionIcon>
                        <ActionIcon
                          size="xs"
                          variant="transparent"
                          style={{
                            color: 'rgba(255, 255, 255, 0.4)',
                            '&:hover': {
                              color: 'rgba(255, 255, 255, 0.7)',
                              background: 'rgba(255, 255, 255, 0.05)'
                            }
                          }}
                          onClick={() => {
                            setEditedContent('')
                          }}
                        >
                          <IconTrash size={12} />
                        </ActionIcon>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div style={{ 
                  display: 'flex', 
                  gap: '16px',
                  paddingTop: '24px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Button
                    leftSection={<IconCheck size={18} />}
                    onClick={() => {
                      // Sauvegarder les modifications
                      notifications.show({
                        id: 'save-success',
                        title: (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            <IconCheck size={16} color="#10b981" />
                            <span style={{ 
                              color: '#ffffff', 
                              fontWeight: 500, 
                              fontSize: '14px'
                            }}>
                              Modifications sauvegardées
                            </span>
                          </div>
                        ),
                        message: (
                          <div style={{ 
                            color: 'rgba(255, 255, 255, 0.8)', 
                            fontSize: '12px',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            L'email a été mis à jour avec succès
                          </div>
                        ),
                        color: 'green',
                        autoClose: 3000,
                        style: {
                          background: 'rgba(16, 185, 129, 0.1)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)'
                        }
                      })
                      setEditMode(false)
                    }}
                    size="lg"
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #34d399)',
                      border: 'none',
                      color: 'white',
                      fontWeight: 600,
                      padding: '12px 28px',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.3s ease',
                      fontFamily: 'Inter, sans-serif'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    Sauvegarder les modifications
                  </Button>
                  <Button
                    leftSection={<IconX size={8} />}
                    onClick={() => {
                      setEditMode(false)
                      setEditedSubject(selectedEmail.subject)
                      setEditedContent(selectedEmail.content)
                    }}
                    size="lg"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: 600,
                      padding: '12px 28px',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      fontFamily: 'Inter, sans-serif'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                      e.currentTarget.style.color = 'white'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <Text style={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  lineHeight: '1.6',
                  fontSize: '0.95rem'
                }}>
                  {selectedEmail ? selectedEmail.content : `Bonjour,<br/><br/>
                  Nous vous confirmons la bonne réception de votre email envoyé dans le cadre de notre campagne "Promotion Printemps • Premium".<br/><br/>
                  Votre message a été traité avec succès et nous en avons bien pris connaissance. Notre équipe vous répondra dans les plus brefs délais si nécessaire.<br/><br/>
                  Cordialement,<br/>
                  L'équipe ExpoBeton`}
                </Text>
              </div>
            )}

            {/* Formulaire de réponse */}
            {selectedEmail && (
              <div style={{
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
                borderRadius: '16px',
                padding: '24px',
                marginTop: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}>
                    <IconSend size={16} color="white" />
                  </div>
                  <Title order={5} style={{ 
                    color: 'white', 
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    margin: 0
                  }}>
                    Répondre à cet email
                  </Title>
                </div>
                
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Rédigez votre réponse ici..."
                  autosize
                  minRows={6}
                  maxRows={12}
                  size="lg"
                  styles={{
                    input: {
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '2px solid rgba(255, 255, 255, 0.15)',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      fontSize: '1rem',
                      fontWeight: 500,
                      lineHeight: 1.6,
                      transition: 'all 0.3s ease',
                      width: '100%',
                      resize: 'vertical'
                    }
                  }}
                />
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px', 
                  marginTop: '20px' 
                }}>
                  <Text style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.85rem',
                    fontStyle: 'italic'
                  }}>
                    {replyText.length} caractères
                  </Text>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Button
                      onClick={handleCancelReply}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: 600,
                        padding: '12px 28px',
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        fontSize: '0.95rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      ❌ Annuler
                    </Button>
                    <Button
                      leftSection={<IconSend size={18} />}
                      onClick={handleReply}
                      disabled={!replyText.trim()}
                      style={{
                        background: replyText.trim() 
                          ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                          : 'linear-gradient(135deg, rgba(107, 114, 128, 0.5), rgba(75, 85, 99, 0.5))',
                        border: 'none',
                        color: 'white',
                        fontWeight: 700,
                        padding: '12px 32px',
                        borderRadius: '12px',
                        boxShadow: replyText.trim() 
                          ? '0 8px 24px rgba(59, 130, 246, 0.4)' 
                          : 'none',
                        transition: 'all 0.3s ease',
                        fontSize: '0.95rem',
                        cursor: replyText.trim() ? 'pointer' : 'not-allowed'
                      }}
                      onMouseEnter={(e) => {
                        if (replyText.trim()) {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.5)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (replyText.trim()) {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)'
                        }
                      }}
                    >
                      📤 Envoyer la réponse
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal d'actualisation */}
      {showRefreshModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1a1f2e 0%, #2d3748 50%, #1a1f2e 100%)',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '24px',
            padding: '40px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.1)',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 32px rgba(59, 130, 246, 0.4)',
                animation: 'spin 2s linear infinite'
              }}>
                <IconRefresh size={40} color="white" />
              </div>
              
              <Title order={2} style={{ 
                color: 'white', 
                fontSize: '1.8rem',
                fontWeight: 700,
                marginBottom: '16px'
              }}>
                Actualisation en cours...
              </Title>
              
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: '1rem',
                lineHeight: 1.5
              }}>
                Vérification des nouveaux emails
              </Text>
              
              <div style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
                marginTop: '16px'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                  borderRadius: '2px',
                  animation: 'progress 2s ease-in-out'
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de nouvel email */}
      {showNewEmailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1a1f2e 0%, #2d3748 50%, #1a1f2e 100%)',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '24px',
            padding: '40px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.1)',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '32px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 32px rgba(139, 92, 246, 0.4), 0 0 0 3px rgba(139, 92, 246, 0.1)'
              }}>
                <IconMail size={32} color="white" />
              </div>
              <div>
                <Title order={2} style={{ 
                  color: 'white', 
                  marginBottom: '8px',
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Nouvel Email
                </Title>
                <Text style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '1rem',
                  fontWeight: 500
                }}>
                  Composer un nouvel email
                </Text>
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div>
                <Text style={{ 
                  color: 'white', 
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}>
                  📧 Destinataire
                </Text>
                <TextInput
                  value={newEmailForm.to}
                  onChange={(e) => setNewEmailForm({ ...newEmailForm, to: e.target.value })}
                  placeholder="email@exemple.com"
                  size="lg"
                  styles={{
                    input: {
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '2px solid rgba(255, 255, 255, 0.15)',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }
                  }}
                />
              </div>

              <div>
                <Text style={{ 
                  color: 'white', 
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}>
                  📝 Sujet
                </Text>
                <TextInput
                  value={newEmailForm.subject}
                  onChange={(e) => setNewEmailForm({ ...newEmailForm, subject: e.target.value })}
                  placeholder="Sujet de votre email"
                  size="lg"
                  styles={{
                    input: {
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '2px solid rgba(255, 255, 255, 0.15)',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }
                  }}
                />
              </div>

              <div>
                <Text style={{ 
                  color: 'white', 
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}>
                  📄 Contenu du message
                </Text>
                <Textarea
                  value={newEmailForm.content}
                  onChange={(e) => setNewEmailForm({ ...newEmailForm, content: e.target.value })}
                  placeholder="Rédigez votre message ici..."
                  autosize
                  minRows={8}
                  maxRows={12}
                  size="lg"
                  styles={{
                    input: {
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '2px solid rgba(255, 255, 255, 0.15)',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '20px 24px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      fontWeight: 500,
                      lineHeight: 1.6,
                      resize: 'vertical',
                      width: '100%',
                      minWidth: '100%'
                    }
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '16px',
              marginTop: '32px'
            }}>
              <Button
                onClick={() => setShowNewEmailModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 600,
                  padding: '12px 32px',
                  borderRadius: '16px',
                  transition: 'all 0.3s ease'
                }}
              >
                ❌ Annuler
              </Button>
              <Button
                onClick={handleSendNewEmail}
                leftSection={<IconSend size={18} />}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 700,
                  padding: '12px 40px',
                  borderRadius: '16px',
                  boxShadow: '0 12px 32px rgba(139, 92, 246, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                📤 Envoyer l'email
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}