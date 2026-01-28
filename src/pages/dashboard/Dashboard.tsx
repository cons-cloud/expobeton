import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Tabs, Title, Text, Card, Button } from '@mantine/core'
import { IconSend, IconUsers, IconChartBar, IconLogout, IconMail, IconActivity } from '@tabler/icons-react'
import { useResponsive, getResponsiveStyles } from '../../hooks/useResponsive'
import { supabase, signOut } from '../../lib/supabase'
import { NotificationBadge } from '../../components/NotificationBadge'
import { Sidebar } from '../../components/dashboard/Sidebar'
import { StatsCards } from '../../components/dashboard/StatsCards'
import { AnalyticsTab } from '../../components/dashboard/AnalyticsTab'
import { CampaignsTab } from '../../components/dashboard/CampaignsTab'
import { ContactsTab } from '../../components/dashboard/ContactsTab'
import { InboxTab } from '../../components/dashboard/InboxTab'
import Footer from '../../components/Footer'

interface Campaign {
  id: string
  name: string
  subject: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  recipients_count: number
  created_at: string
  content?: string
  scheduled_at?: string
}

interface Contact {
  id: string
  email: string
  first_name: string
  last_name: string
  company?: string
  created_at: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const responsive = useResponsive()
  const responsiveStyles = getResponsiveStyles(responsive)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [analytics, setAnalytics] = useState({
    open_rate: 68.5,
    click_rate: 12.3
  })
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({
    name: '',
    subject: '',
    content: '',
    status: 'draft',
    recipients_count: 100
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Charger les campagnes
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (campaignsError) {
        console.error('Erreur lors du chargement des campagnes:', campaignsError)
      } else {
        setCampaigns(campaignsData || [])
      }

      // Charger les contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })

      if (contactsError) {
        console.error('Erreur lors du chargement des contacts:', contactsError)
      } else {
        setContacts(contactsData || [])
      }

      // Charger les statistiques d'emails
      const { data: statsData, error: statsError } = await supabase
        .from('email_stats')
        .select('*')

      if (statsError) {
        console.error('Erreur lors du chargement des statistiques:', statsError)
        // Utiliser des valeurs par défaut
        setAnalytics({
          open_rate: 68.5,
          click_rate: 12.3
        })
      } else {
        // Calculer les statistiques totales
        const totalSent = statsData?.reduce((sum, stat) => sum + (stat.total_sent || 0), 0) || 0
        const totalOpened = statsData?.reduce((sum, stat) => sum + (stat.total_opened || 0), 0) || 0
        const totalClicked = statsData?.reduce((sum, stat) => sum + (stat.total_clicked || 0), 0) || 0
        
        const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 68.5
        const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 12.3
        
        setAnalytics({
          open_rate: openRate,
          click_rate: clickRate
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  const handleCreateCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          name: newCampaign.name,
          subject: newCampaign.subject,
          content: newCampaign.content,
          status: 'draft',
          recipients_count: newCampaign.recipients_count,
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Erreur lors de la création de la campagne:', error)
        alert('Erreur lors de la création de la campagne')
      } else {
        console.log('Campagne créée avec succès:', data)
        setCreateModalOpen(false)
        setNewCampaign({
          name: '',
          subject: '',
          content: '',
          status: 'draft',
          recipients_count: 100
        })
        loadData()
      }
    } catch (error) {
      console.error('Erreur lors de la création de la campagne:', error)
      alert('Erreur lors de la création de la campagne')
    }
  }

  const handleSendCampaign = async (id: string) => {
    try {
      // Récupérer les détails de la campagne
      const { data: campaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !campaign) {
        throw new Error('Campagne non trouvée')
      }

      // Mettre à jour le statut à "sending"
      await supabase
        .from('campaigns')
        .update({ status: 'sending' })
        .eq('id', id)

      // Récupérer les contacts pour l'envoi
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('email')
      
      if (contactsError) {
        throw new Error('Erreur lors de la récupération des contacts')
      }

      const recipientEmails = contactsData?.map(contact => contact.email) || []
      
      if (recipientEmails.length === 0) {
        throw new Error('Aucun contact trouvé pour l\'envoi')
      }

      // Importer le service d'envoi d'emails
      const { sendBulkEmails } = await import('../../services/emailService')
      
      console.log('Envoi de la campagne à', recipientEmails.length, 'contacts')
      
      // Préparer les emails pour l'envoi en masse
      const emailsToSend = recipientEmails.map(email => ({
        to: email,
        subject: campaign.subject,
        html: campaign.content || ''
      }))
      
      // Envoyer la campagne en utilisant le service réel
      const result = await sendBulkEmails(emailsToSend)

      if (result.success) {
        console.log(`Campagne envoyée: ${result.summary.sent} emails, ${result.summary.failed} échecs`)
        
        // Mettre à jour le statut de la campagne
        await supabase
          .from('campaigns')
          .update({ 
            status: result.summary.failed === 0 ? 'sent' : 'partial',
            sent_at: new Date().toISOString()
          })
          .eq('id', id)
          
        // Afficher une notification de succès avec alert pour l'instant
        alert(`Campagne envoyée avec succès!\n${result.summary.sent} emails envoyés${result.summary.failed > 0 ? `, ${result.summary.failed} échecs` : ''}`)
      } else {
        const errors = result.results.filter(r => !r.success).map(r => r.error).join(', ')
        throw new Error(`Échec de l'envoi: ${errors}`)
      }

      // Recharger les données
      loadData()

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la campagne:', error)
      
      // Remettre le statut à "draft" en cas d'erreur
      await supabase
        .from('campaigns')
        .update({ status: 'draft' })
        .eq('id', id)
      
      alert(`Erreur lors de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erreur lors de la suppression de la campagne:', error)
        alert('Erreur lors de la suppression de la campagne')
      } else {
        loadData()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la campagne:', error)
      alert('Erreur lors de la suppression de la campagne')
    }
  }

  const handleEditCampaign = async (updatedCampaign: Campaign) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          name: updatedCampaign.name,
          subject: updatedCampaign.subject,
          content: updatedCampaign.content,
          recipients_count: updatedCampaign.recipients_count,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedCampaign.id)

      if (error) {
        console.error('Erreur lors de la mise à jour de la campagne:', error)
        alert('Erreur lors de la mise à jour de la campagne')
      } else {
        loadData()
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la campagne:', error)
      alert('Erreur lors de la mise à jour de la campagne')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'gray'
      case 'scheduled': return 'blue'
      case 'sending': return 'yellow'
      case 'sent': return 'green'
      case 'failed': return 'red'
      default: return 'gray'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon'
      case 'scheduled': return 'Programmé'
      case 'sending': return 'Envoi en cours'
      case 'sent': return 'Envoyé'
      case 'failed': return 'Échoué'
      default: return 'Inconnu'
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      position: 'relative'
    }}>
      {/* Barre latérale - Responsive */}
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        isMobile={responsive.isMobile}
      />
      
      {/* Contenu principal - Responsive */}
      <div style={{
        flex: 1,
        marginLeft: responsive.isMobile ? '0' : (sidebarCollapsed ? '80px' : '280px'),
        width: responsive.isMobile ? '100%' : `calc(100% - ${sidebarCollapsed ? '80px' : '280px'})`,
        marginRight: responsive.isMobile ? '0' : (sidebarCollapsed ? '20px' : '40px'),
        transition: 'all 0.3s ease',
        display: 'flex',
        justifyContent: responsive.isMobile || sidebarCollapsed ? 'center' : 'flex-start'
      }}>
        <Container 
          size="xl" 
          py="md" 
          style={{
            maxWidth: responsive.isMobile || sidebarCollapsed ? '100%' : '100%',
            padding: responsiveStyles.container.padding,
            width: '100%'
          }}
        >
          {/* Header avec titre et actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: responsive.isMobile ? 'flex-start' : 'center',
            marginBottom: responsive.isMobile ? '24px' : '32px',
            padding: '16px 0',
            gap: responsive.isMobile ? '16px' : '24px',
            flexDirection: responsive.isMobile ? 'column' : 'row'
          }}>
            {/* Titre ExpoBeton Email */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              flex: 1,
              textAlign: responsive.isMobile ? 'center' : 'left'
            }}>
              <Text style={{
                color: 'white',
                fontSize: responsive.isSmallMobile ? '1.5rem' : responsive.isMobile ? '1.8rem' : '2rem',
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                ExpoBeton Email
              </Text>
              <Text style={{
                color: '#9ca3af',
                fontSize: responsive.isSmallMobile ? '0.875rem' : responsive.isMobile ? '0.9rem' : '1rem',
                lineHeight: 1,
                fontWeight: 500
              }}>
                Plateforme Email Marketing
              </Text>
            </div>

            {/* Actions à droite */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: responsive.isMobile ? '12px' : '16px',
              width: responsive.isMobile ? '100%' : 'auto',
              justifyContent: responsive.isMobile ? 'space-between' : 'flex-end'
            }}>
              {/* Icône de notification */}
              <NotificationBadge />
              
              {/* Icône de déconnexion */}
              <Button
                leftSection={responsive.isMobile ? undefined : <IconLogout size={16} />}
                onClick={handleLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontWeight: 600,
                  padding: responsive.isMobile ? '10px 16px' : '12px 20px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                  transition: 'all 0.3s ease',
                  fontSize: responsive.isMobile ? '0.875rem' : '1rem',
                  minWidth: responsive.isMobile ? 'auto' : '120px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)'
                }}
              >
                {responsive.isMobile ? <IconLogout size={16} /> : 'Déconnexion'}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <StatsCards 
            campaigns={campaigns} 
            contacts={contacts} 
            analytics={analytics} 
          />

          {/* Tabs */}
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'overview')} variant="pills">
            <Tabs.List style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: responsive.isMobile ? '2px' : '4px',
              borderRadius: '12px',
              marginBottom: responsive.isMobile ? '16px' : '24px',
              display: 'flex',
              justifyContent: responsive.isMobile ? 'flex-start' : 'center',
              gap: responsive.isMobile ? '4px' : '8px',
              flexWrap: responsive.isMobile ? 'nowrap' : 'wrap',
              overflowX: responsive.isMobile ? 'auto' : 'visible',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              <Tabs.Tab 
                value="overview" 
                leftSection={<IconChartBar size={responsive.isMobile ? 14 : 16} />}
                style={{
                  color: activeTab === 'overview' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  background: activeTab === 'overview' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                  borderRadius: '12px',
                  padding: responsive.isMobile ? '8px 16px' : '12px 24px',
                  fontWeight: activeTab === 'overview' ? 600 : 400,
                  transition: 'all 0.3s ease',
                  fontSize: responsive.isMobile ? '0.875rem' : '1rem',
                  border: activeTab === 'overview' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                  boxShadow: activeTab === 'overview' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                  transform: activeTab === 'overview' ? 'translateY(-2px)' : 'translateY(0)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'overview') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'overview') {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                Aperçu
              </Tabs.Tab>
              <Tabs.Tab 
                value="campaigns" 
                leftSection={<IconSend size={responsive.isMobile ? 14 : 16} />}
                style={{
                  color: activeTab === 'campaigns' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  background: activeTab === 'campaigns' ? 'linear-gradient(135deg, #10b981, #34d399)' : 'transparent',
                  borderRadius: '12px',
                  padding: responsive.isMobile ? '8px 16px' : '12px 24px',
                  fontWeight: activeTab === 'campaigns' ? 600 : 400,
                  transition: 'all 0.3s ease',
                  fontSize: responsive.isMobile ? '0.875rem' : '1rem',
                  border: activeTab === 'campaigns' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                  boxShadow: activeTab === 'campaigns' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                  transform: activeTab === 'campaigns' ? 'translateY(-2px)' : 'translateY(0)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'campaigns') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'campaigns') {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                Campagnes
              </Tabs.Tab>
              <Tabs.Tab 
                value="contacts" 
                leftSection={<IconUsers size={responsive.isMobile ? 14 : 16} />}
                style={{
                  color: activeTab === 'contacts' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  background: activeTab === 'contacts' ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'transparent',
                  borderRadius: '12px',
                  padding: responsive.isMobile ? '8px 16px' : '12px 24px',
                  fontWeight: activeTab === 'contacts' ? 600 : 400,
                  transition: 'all 0.3s ease',
                  fontSize: responsive.isMobile ? '0.875rem' : '1rem',
                  border: activeTab === 'contacts' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                  boxShadow: activeTab === 'contacts' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
                  transform: activeTab === 'contacts' ? 'translateY(-2px)' : 'translateY(0)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'contacts') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'contacts') {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                Contacts
              </Tabs.Tab>
              <Tabs.Tab 
                value="inbox" 
                leftSection={<IconMail size={responsive.isMobile ? 14 : 16} />}
                style={{
                  color: activeTab === 'inbox' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  background: activeTab === 'inbox' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'transparent',
                  borderRadius: '12px',
                  padding: responsive.isMobile ? '8px 16px' : '12px 24px',
                  fontWeight: activeTab === 'inbox' ? 600 : 400,
                  transition: 'all 0.3s ease',
                  fontSize: responsive.isMobile ? '0.875rem' : '1rem',
                  border: activeTab === 'inbox' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                  boxShadow: activeTab === 'inbox' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
                  transform: activeTab === 'inbox' ? 'translateY(-2px)' : 'translateY(0)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'inbox') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'inbox') {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                Boîte de Réception
              </Tabs.Tab>
              <Tabs.Tab 
                value="analytics" 
                leftSection={<IconActivity size={responsive.isMobile ? 14 : 16} />}
                style={{
                  color: activeTab === 'analytics' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  background: activeTab === 'analytics' ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'transparent',
                  borderRadius: '12px',
                  padding: responsive.isMobile ? '8px 16px' : '12px 24px',
                  fontWeight: activeTab === 'analytics' ? 600 : 400,
                  transition: 'all 0.3s ease',
                  fontSize: responsive.isMobile ? '0.875rem' : '1rem',
                  border: activeTab === 'analytics' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                  boxShadow: activeTab === 'analytics' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
                  transform: activeTab === 'analytics' ? 'translateY(-2px)' : 'translateY(0)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'analytics') {
                    e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.2)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'analytics') {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                📊 Aperçu
              </Tabs.Tab>
            </Tabs.List>

            {/* Analytics Tab - Synchronisé */}
            <Tabs.Panel value="overview">
              <AnalyticsTab />
            </Tabs.Panel>

            {/* Campaigns Tab */}
            <Tabs.Panel value="campaigns">
              <CampaignsTab
                campaigns={campaigns}
                createModalOpen={createModalOpen}
                setCreateModalOpen={setCreateModalOpen}
                newCampaign={newCampaign}
                setNewCampaign={setNewCampaign}
                handleCreateCampaign={handleCreateCampaign}
                handleEditCampaign={handleEditCampaign}
                handleSendCampaign={handleSendCampaign}
                handleDeleteCampaign={handleDeleteCampaign}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
              />
            </Tabs.Panel>

            {/* Contacts Tab */}
            <Tabs.Panel value="contacts">
              <ContactsTab 
                contacts={contacts}
                setContacts={setContacts}
              />
            </Tabs.Panel>

            {/* Inbox Tab */}
            <Tabs.Panel value="inbox">
              <InboxTab />
            </Tabs.Panel>

            {/* Analytics Tab */}
            <Tabs.Panel value="analytics">
              <div style={{ padding: '20px 0' }}>
                <Title order={2} style={{ 
                  color: 'white', 
                  marginBottom: '32px',
                  textAlign: 'center',
                  fontSize: '2rem',
                  fontWeight: 700
                }}>
                  Analytiques
                </Title>

                <div style={{
                  display: 'flex',
                  gap: '24px',
                  justifyContent: 'center',
                  alignItems: 'stretch'
                }}>
                  <Card style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    padding: '20px',
                    borderRadius: '16px',
                    flex: 1,
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)'
                  }}>
                    <Title order={4} style={{ color: 'white', marginBottom: '16px' }}>
                      Performance des Campagnes
                    </Title>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#60a5fa' }}>Graphique Chart.js</Text>
                    </div>
                  </Card>

                  <Card style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '20px',
                    borderRadius: '16px',
                    flex: 1,
                    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)'
                  }}>
                    <Title order={4} style={{ color: 'white', marginBottom: '16px' }}>
                      Statistiques des Emails
                    </Title>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#34d399' }}>Graphique Chart.js</Text>
                    </div>
                  </Card>

                  <Card style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '20px',
                    borderRadius: '16px',
                    flex: 1,
                    boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)'
                  }}>
                    <Title order={4} style={{ color: 'white', marginBottom: '16px' }}>
                      Taux de Conversion
                    </Title>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px',
                          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)'
                        }}>
                          <Text style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>%</Text>
                        </div>
                        <Text style={{ color: '#f87171', fontSize: '0.9rem' }}>Graphique Chart.js</Text>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </Tabs.Panel>
          </Tabs>

          <Footer />
        </Container>
      </div>
    </div>
  )
}