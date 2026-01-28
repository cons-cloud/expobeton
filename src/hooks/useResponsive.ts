import { useState, useEffect } from 'react'

export interface ResponsiveConfig {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isSmallMobile: boolean
  screenWidth: number
}

export const useResponsive = (): ResponsiveConfig => {
  const [screenWidth, setScreenWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  )

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isSmallMobile = screenWidth < 480
  const isMobile = screenWidth < 768
  const isTablet = screenWidth >= 768 && screenWidth < 1024
  const isDesktop = screenWidth >= 1024

  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    screenWidth
  }
}

export const getResponsiveStyles = (responsive: ResponsiveConfig) => {
  const { isMobile, isTablet, isSmallMobile } = responsive

  return {
    // Container styles
    container: {
      padding: isSmallMobile ? '0 8px' : isMobile ? '0 12px' : '0 16px',
      maxWidth: '100%'
    },

    // Main content area
    mainContent: {
      marginLeft: isMobile ? '0' : isTablet ? '240px' : '280px',
      width: isMobile ? '100%' : `calc(100% - ${isTablet ? '240px' : '280px'})`,
      transition: 'all 0.3s ease'
    },

    // Header actions
    headerActions: {
      gap: isSmallMobile ? '8px' : isMobile ? '12px' : '16px',
      marginBottom: isSmallMobile ? '16px' : isMobile ? '20px' : '32px',
      padding: isSmallMobile ? '8px 0' : isMobile ? '12px 0' : '16px 0'
    },

    // Button styles
    button: {
      padding: isSmallMobile ? '8px 12px' : isMobile ? '10px 16px' : '12px 20px',
      fontSize: isSmallMobile ? '0.875rem' : isMobile ? '0.9rem' : '1rem'
    },

    // Card grid
    cardGrid: {
      gridTemplateColumns: isSmallMobile ? '1fr' : isMobile ? 'repeat(auto-fit, minmax(280px, 1fr))' : isTablet ? 'repeat(auto-fit, minmax(300px, 1fr))' : 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: isSmallMobile ? '12px' : isMobile ? '16px' : '20px'
    },

    // Modal styles
    modal: {
      width: isSmallMobile ? '95%' : isMobile ? '90%' : isTablet ? '85%' : '80%',
      maxWidth: isSmallMobile ? '400px' : isMobile ? '500px' : isTablet ? '600px' : '800px',
      padding: isSmallMobile ? '20px' : isMobile ? '24px' : '32px'
    },

    // Form styles
    formRow: {
      flexDirection: isMobile ? 'column' : 'row' as const,
      gap: isMobile ? '16px' : '20px'
    },

    // Text sizes
    title: {
      fontSize: isSmallMobile ? '1.25rem' : isMobile ? '1.5rem' : '1.75rem'
    },
    subtitle: {
      fontSize: isSmallMobile ? '0.875rem' : isMobile ? '0.9rem' : '1rem'
    }
  }
}
