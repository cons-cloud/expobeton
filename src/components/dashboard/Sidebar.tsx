import { useState } from 'react'
import {
  ActionIcon,
  Tooltip,
  Text
} from '@mantine/core'
import {
  IconDashboard,
  IconMail,
  IconUsers,
  IconInbox,
  IconChartBar,
  IconMenu2,
  IconX
} from '@tabler/icons-react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  isMobile?: boolean
}

export function Sidebar({ activeTab, onTabChange, collapsed = false, onCollapsedChange, isMobile = false }: SidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuItems = [
    {
      id: 'overview',
      label: 'Tableau de bord',
      icon: IconDashboard,
      color: '#3b82f6',
      description: 'Vue d\'ensemble'
    },
    {
      id: 'campaigns',
      label: 'Campagnes',
      icon: IconMail,
      color: '#10b981',
      description: 'Gérer les campagnes email'
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: IconUsers,
      color: '#f59e0b',
      description: 'Gérer les contacts'
    },
    {
      id: 'inbox',
      label: 'Boîte de réception',
      icon: IconInbox,
      color: '#8b5cf6',
      description: 'Emails reçus'
    },
    {
      id: 'analytics',
      label: 'Analytiques',
      icon: IconChartBar,
      color: '#ef4444',
      description: 'Statistiques et rapports'
    }
  ]

  const toggleSidebar = () => {
    if (onCollapsedChange) {
      onCollapsedChange(!collapsed)
    }
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1001,
          background: 'linear-gradient(135deg, #10b981, #34d399)',
          borderRadius: '12px',
          padding: '8px',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
        }}>
          <ActionIcon
            onClick={toggleMobileMenu}
            style={{
              background: 'transparent',
              color: 'white',
              border: 'none'
            }}
          >
            {mobileMenuOpen ? <IconX size={12} /> : <IconMenu2 size={24} />}
          </ActionIcon>
        </div>
      )}

      {/* Sidebar */}
      <div style={{
        width: isMobile ? (mobileMenuOpen ? '280px' : '0') : (collapsed ? '80px' : '280px'),
        height: '100vh',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        borderRight: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: isMobile ? (mobileMenuOpen ? 1000 : 999) : 1000,
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        transform: isMobile ? (mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        boxShadow: isMobile && mobileMenuOpen ? '0 0 50px rgba(0, 0, 0, 0.5)' : 'none'
      }}>
        {/* Header */}
        <div style={{
          padding: collapsed ? '20px 16px' : '24px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between'
        }}>
          {/* Logo simple dans la barre latérale */}
          {!collapsed && !isMobile && (
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}>
              <Text style={{
                color: 'white',
                fontSize: '1rem',
                fontWeight: 700,
                lineHeight: 1
              }}>
                EB
              </Text>
            </div>
          )}
          
          {/* Bouton pour réduire/agrandir */}
          {!isMobile && (
            <ActionIcon
              variant="light"
              onClick={toggleSidebar}
              size="lg"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                borderRadius: '12px',
                width: '44px',
                height: '44px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
              }}
            >
              {collapsed ? '→' : '←'}
            </ActionIcon>
          )}
        </div>

        {/* Navigation */}
        <div style={{
          flex: 1,
          padding: collapsed ? '20px 8px' : '20px 12px',
          overflowY: 'auto'
        }}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            
            return (
              <Tooltip
                key={item.id}
                label={collapsed ? item.label : ''}
                position="right"
                withArrow
                offset={10}
              >
                <div
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: collapsed ? '0' : '16px',
                    padding: collapsed ? '16px 8px' : '16px 20px',
                    borderRadius: '16px',
                    background: isActive 
                      ? `${item.color}20` 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: isActive 
                      ? `2px solid ${item.color}` 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginBottom: '8px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }
                  }}
                >
                  {/* Icône */}
                  <div style={{
                    width: collapsed ? '32px' : '40px',
                    height: collapsed ? '32px' : '40px',
                    borderRadius: '12px',
                    background: isActive 
                      ? item.color 
                      : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    <Icon 
                      size={collapsed ? 18 : 20} 
                      color={isActive ? 'white' : item.color}
                    />
                  </div>

                  {/* Texte */}
                  {!collapsed && !isMobile && (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                      <Text style={{
                        color: isActive ? item.color : 'white',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        lineHeight: 1.2
                      }}>
                        {item.label}
                      </Text>
                      <Text style={{
                        color: '#6b7280',
                        fontSize: '0.75rem',
                        lineHeight: 1.2
                      }}>
                        {item.description}
                      </Text>
                    </div>
                  )}
                </div>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </>
  )
}
