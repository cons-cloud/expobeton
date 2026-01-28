import { useState } from 'react'
import { Title, Text, Card, Button, Badge, ActionIcon, TextInput, Textarea, NumberInput } from '@mantine/core'
import { IconPlus, IconEdit, IconSend, IconTrash } from '@tabler/icons-react'
import { useResponsive, getResponsiveStyles } from '../../hooks/useResponsive'

interface Campaign {
  id: string
  name: string
  subject: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  created_at: string
  content?: string
  recipients_count: number
}

interface CampaignsTabProps {
  campaigns: Campaign[]
  createModalOpen: boolean
  setCreateModalOpen: (open: boolean) => void
  newCampaign: Partial<Campaign>
  setNewCampaign: (campaign: Partial<Campaign>) => void
  handleCreateCampaign: () => void
  handleEditCampaign: (campaign: Campaign) => Promise<void>
  handleSendCampaign: (id: string) => void
  handleDeleteCampaign: (id: string) => void
  getStatusColor: (status: string) => string
  getStatusText: (status: string) => string
}

export function CampaignsTab({ 
  campaigns, 
  createModalOpen, 
  setCreateModalOpen, 
  newCampaign, 
  setNewCampaign, 
  handleCreateCampaign, 
  handleEditCampaign, 
  handleSendCampaign, 
  handleDeleteCampaign, 
  getStatusColor, 
  getStatusText 
}: CampaignsTabProps) {
  
  const responsive = useResponsive()
  const responsiveStyles = getResponsiveStyles(responsive)
  
  // Debug pour voir l'état du modal
  console.log('CampaignsTab - createModalOpen:', createModalOpen);

  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [editCampaignForm, setEditCampaignForm] = useState({
    name: '',
    subject: '',
    content: '',
    recipients_count: 1000
  })

  const handleEditCampaignModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setEditCampaignForm({
      name: campaign.name,
      subject: campaign.subject,
      content: campaign.content || '',
      recipients_count: campaign.recipients_count || 1000
    })
    setShowEditModal(true)
  }

  const handleSaveEditCampaign = () => {
    if (selectedCampaign) {
      const updatedCampaign = {
        ...selectedCampaign,
        ...editCampaignForm
      }
      handleEditCampaign(updatedCampaign)
      setShowEditModal(false)
      setSelectedCampaign(null)
    }
  }

  return (
    <>
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
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
            }}>
              <IconSend size={24} color="white" />
            </div>
            <div>
              <Title order={3} style={{ 
                color: 'white',
                marginBottom: '4px',
                fontSize: '1.5rem',
                fontWeight: 700,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                📧 Campagnes Email
              </Title>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '0.95rem'
              }}>
                {campaigns.length} campagne(s) au total • Expéditeur: henrinelngando229@gmail.com
              </Text>
            </div>
          </div>
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => {
              console.log('Ouverture du modal de création');
              setCreateModalOpen(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              border: 'none',
              color: 'white',
              fontWeight: 600,
              padding: '12px 24px',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              fontSize: '1rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)'
            }}
          >
            ✨ Créer Campagne
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {campaigns.length === 0 ? (
            <Card style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '60px 40px',
              textAlign: 'center',
              borderRadius: '20px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.1))',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <IconSend size={40} color="#10b981" />
              </div>
              <Title order={4} style={{ 
                color: 'white', 
                marginBottom: '12px',
                fontSize: '1.3rem'
              }}>
                📭 Aucune campagne
              </Title>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '1rem',
                marginBottom: '24px'
              }}>
                Créez votre première campagne email automatique
              </Text>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setCreateModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 600,
                  padding: '12px 24px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
                }}
              >
                ✨ Créer ma première campagne
              </Button>
            </Card>
          ) : (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'flex-start',
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              {campaigns.map((campaign) => (
                <Card key={campaign.id} style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '24px',
                  borderRadius: '20px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  minWidth: '350px',
                  maxWidth: '450px',
                  flex: '1'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.boxShadow = 'none'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: campaign.status === 'sent' ? '#10b981' : 
                                     campaign.status === 'sending' ? '#f59e0b' : 
                                     campaign.status === 'draft' ? '#6b7280' : '#3b82f6'
                        }} />
                        <Text style={{ 
                          color: 'white', 
                          fontWeight: 600,
                          fontSize: '1.2rem'
                        }}>
                          {campaign.name}
                        </Text>
                      </div>
                      
                      <Text style={{ 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        fontSize: '1rem',
                        marginBottom: '16px',
                        lineHeight: '1.4'
                      }}>
                        📧 {campaign.subject}
                      </Text>
                      
                      {campaign.content && (
                        <Text style={{ 
                          color: 'rgba(255, 255, 255, 0.6)', 
                          fontSize: '0.9rem',
                          marginBottom: '16px',
                          lineHeight: '1.4'
                        }}>
                          {campaign.content.length > 100 ? campaign.content.substring(0, 100) + '...' : campaign.content}
                        </Text>
                      )}
                      
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'center',
                        marginTop: '16px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Text style={{ 
                            color: 'rgba(255, 255, 255, 0.6)', 
                            fontSize: '0.85rem'
                          }}>
                            📅
                          </Text>
                          <Text style={{ 
                            color: 'rgba(255, 255, 255, 0.8)', 
                            fontSize: '0.9rem'
                          }}>
                            {new Date(campaign.created_at).toLocaleDateString()}
                          </Text>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Text style={{ 
                            color: 'rgba(255, 255, 255, 0.6)', 
                            fontSize: '0.85rem'
                          }}>
                            📊
                          </Text>
                          <Badge 
                            color={getStatusColor(campaign.status)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            {getStatusText(campaign.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginLeft: '16px'
                    }}>
                      <ActionIcon
                        variant="light"
                        size="lg"
                        onClick={() => handleEditCampaignModal(campaign)}
                        style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                          e.currentTarget.style.transform = 'scale(1.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        <IconEdit size={18} color="#3b82f6" />
                      </ActionIcon>
                      
                      {campaign.status === 'draft' && (
                        <ActionIcon
                          variant="light"
                          color="green"
                          size="lg"
                          onClick={() => handleSendCampaign(campaign.id)}
                          style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'
                            e.currentTarget.style.transform = 'scale(1.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          <IconSend size={18} color="#10b981" />
                        </ActionIcon>
                      )}
                      
                      <ActionIcon
                        variant="light"
                        color="red"
                        size="lg"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
                          e.currentTarget.style.transform = 'scale(1.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        <IconTrash size={18} color="#ef4444" />
                      </ActionIcon>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Campaign Modal - Custom Implementation */}
      {createModalOpen && (
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
        }}
        onClick={() => setCreateModalOpen(false)}
        >
          <div style={{
            background: 'linear-gradient(145deg, #1a1f2e 0%, #2d3748 50%, #1a1f2e 100%)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: responsive.isMobile ? '16px' : '24px',
            padding: responsiveStyles.modal.padding,
            width: responsiveStyles.modal.width,
            maxWidth: responsiveStyles.modal.maxWidth,
            maxHeight: '85vh',
            overflow: 'auto',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.1)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
          >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px'
        }}>
          <div style={responsiveStyles.cardGrid}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 32px rgba(16, 185, 129, 0.4), 0 0 0 3px rgba(16, 185, 129, 0.1)'
            }}>
              <IconPlus size={32} color="white" />
            </div>
            <div>
              <Title order={2} style={{ 
                color: 'white', 
                marginBottom: '8px',
                fontSize: '1.8rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981, #34d399)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                ✨ Nouvelle Campagne Email
              </Title>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: '1rem',
                fontWeight: 500
              }}>
                Créez votre campagne email professionnelle
              </Text>
            </div>
          </div>
          <Button
            onClick={() => setCreateModalOpen(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '12px',
              padding: '8px',
              minWidth: 'auto',
              width: '40px',
              height: '40px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            ✕
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <Text style={{ 
                color: 'white', 
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📝 Nom de la campagne
              </Text>
              <TextInput
                placeholder="Ex: Promotion de Printemps 2026"
                value={newCampaign.name || ''}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                size="lg"
                styles={{
                  input: {
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '2px solid rgba(255, 255, 255, 0.15)',
                    color: 'white',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    fontWeight: 500,
                    '&:focus': {
                      background: 'rgba(255, 255, 255, 0.12)',
                      borderColor: '#10b981',
                      boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
                    },
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.5)'
                    }
                  }
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <Text style={{ 
                color: 'white', 
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📧 Sujet de l'email
              </Text>
              <TextInput
                placeholder="Ex: Offre spéciale pour nos clients fidèles"
                value={newCampaign.subject || ''}
                onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                size="lg"
                styles={{
                  input: {
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '2px solid rgba(255, 255, 255, 0.15)',
                    color: 'white',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    fontWeight: 500,
                    '&:focus': {
                      background: 'rgba(255, 255, 255, 0.12)',
                      borderColor: '#10b981',
                      boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
                    },
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.5)'
                    }
                  }
                }}
              />
            </div>
          </div>

          <div style={{ width: '100%' }}>
            <Text style={{ 
              color: 'white', 
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📄 Contenu de l'email
            </Text>
            <Textarea
              placeholder="Rédigez votre message ici...&#10;&#10;Cher [Nom du client],&#10;&#10;Nous sommes ravis de vous présenter notre nouvelle collection...&#10;&#10;Cordialement,&#10;L'équipe ExpoBeton"
              value={newCampaign.content || ''}
              onChange={(e) => setNewCampaign({ ...newCampaign, content: e.target.value })}
              autosize
              minRows={10}
              maxRows={15}
              size="lg"
              styles={{
                input: {
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  fontWeight: 500,
                  lineHeight: 1.6,
                  resize: 'vertical',
                  width: '100%',
                  minWidth: '100%',
                  '&:focus': {
                    background: 'rgba(255, 255, 255, 0.12)',
                    borderColor: '#10b981',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
                  },
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)'
                  }
                }
              }}
            />
          </div>

          <div>
            <Text style={{ 
              color: 'white', 
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📊 Nombre de destinataires
            </Text>
            <NumberInput
              placeholder="1000"
              min={1}
              max={50000}
              value={newCampaign.recipients_count || 1000}
              onChange={(value: number | string) => setNewCampaign({ ...newCampaign, recipients_count: typeof value === 'number' ? value : parseInt(value) || 1000 })}
              size="lg"
              styles={{
                input: {
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  fontWeight: 500,
                  '&:focus': {
                    background: 'rgba(255, 255, 255, 0.12)',
                    borderColor: '#10b981',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
                  },
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)'
                  }
                }
              }}
            />
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.05))',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '20px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            <Text style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '1rem',
              fontWeight: 500,
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ℹ️ Les emails seront envoyés automatiquement à tous les contacts de votre liste
            </Text>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginTop: '8px'
          }}>
            <Button
              onClick={() => setCreateModalOpen(false)}
              size="lg"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 600,
                padding: '16px 32px',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                fontSize: '1rem',
                flex: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              }}
            >
              ❌ Annuler
            </Button>
            <Button
              onClick={handleCreateCampaign}
              size="lg"
              style={{
                background: 'linear-gradient(135deg, #10b981, #34d399)',
                border: 'none',
                color: 'white',
                fontWeight: 700,
                padding: '16px 40px',
                borderRadius: '16px',
                boxShadow: '0 12px 32px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.3s ease',
                fontSize: '1rem',
                flex: 1.5
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(16, 185, 129, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.4)'
              }}
            >
              🚀 Créer et Envoyer
            </Button>
          </div>
        </div>
          </div>
        </div>
      )}

      {/* Modal d'édition de campagne */}
      {showEditModal && (
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.1)',
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
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 32px rgba(59, 130, 246, 0.4), 0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}>
                <IconEdit size={32} color="white" />
              </div>
              <div>
                <Title order={2} style={{ 
                  color: 'white', 
                  marginBottom: '8px',
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Éditer la campagne
                </Title>
                <Text style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '1rem',
                  fontWeight: 500
                }}>
                  Modifier les détails de votre campagne email
                </Text>
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <Text style={{ 
                    color: 'white', 
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '8px'
                  }}>
                    📝 Nom de la campagne
                  </Text>
                  <TextInput
                    value={editCampaignForm.name}
                    onChange={(e) => setEditCampaignForm({ ...editCampaignForm, name: e.target.value })}
                    placeholder="Ma campagne"
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
                <div style={{ flex: 1 }}>
                  <Text style={{ 
                    color: 'white', 
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '8px'
                  }}>
                    📧 Sujet de l'email
                  </Text>
                  <TextInput
                    value={editCampaignForm.subject}
                    onChange={(e) => setEditCampaignForm({ ...editCampaignForm, subject: e.target.value })}
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
              </div>

              <div>
                <Text style={{ 
                  color: 'white', 
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}>
                  📄 Contenu de l'email
                </Text>
                <Textarea
                  value={editCampaignForm.content}
                  onChange={(e) => setEditCampaignForm({ ...editCampaignForm, content: e.target.value })}
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

              <div>
                <Text style={{ 
                  color: 'white', 
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}>
                  📊 Nombre de destinataires
                </Text>
                <NumberInput
                  value={editCampaignForm.recipients_count}
                  onChange={(value: number | string) => setEditCampaignForm({ ...editCampaignForm, recipients_count: typeof value === 'number' ? value : parseInt(value) || 1000 })}
                  min={1}
                  max={50000}
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
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '16px',
              marginTop: '32px'
            }}>
              <Button
                onClick={() => setShowEditModal(false)}
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
                onClick={handleSaveEditCampaign}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 700,
                  padding: '12px 40px',
                  borderRadius: '16px',
                  boxShadow: '0 12px 32px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                ✅ Sauvegarder les modifications
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
