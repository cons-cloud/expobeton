import { useState, useCallback } from 'react'
import { notifications } from '@mantine/notifications'

interface LoadTestConfig {
  batchSize: number
  delayBetweenBatches: number
  maxConcurrent: number
  testDuration: number
}

interface LoadTestResult {
  totalSent: number
  totalSuccess: number
  totalFailed: number
  averageTime: number
  successRate: number
  errors: string[]
}

export const useEmailLoadTest = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<LoadTestResult | null>(null)

  const generateTestEmail = useCallback((index: number) => ({
    to: `test${index}@example.com`,
    toName: `Test User ${index}`,
    subject: `Load Test Email ${index}`,
    html: `
      <h1>Test Email ${index}</h1>
      <p>This is a load test email number ${index}</p>
      <p>Timestamp: ${new Date().toISOString()}</p>
      <p>Random data: ${Math.random().toString(36).substring(7)}</p>
    `,
    campaignId: `load-test-${Date.now()}`
  }), [])

  const runLoadTest = useCallback(async (config: LoadTestConfig) => {
    setIsRunning(true)
    setProgress(0)
    setResults(null)

    const results: LoadTestResult = {
      totalSent: 0,
      totalSuccess: 0,
      totalFailed: 0,
      averageTime: 0,
      successRate: 0,
      errors: []
    }

    const times: number[] = []

    try {
      // Générer les emails de test
      const testEmails = Array.from({ length: config.batchSize }, (_, i) => 
        generateTestEmail(i)
      )

      // Envoyer par lots avec contrôle de concurrence
      for (let i = 0; i < testEmails.length; i += config.maxConcurrent) {
        const batch = testEmails.slice(i, i + config.maxConcurrent)
        
        const batchPromises = batch.map(async (email) => {
          const emailStartTime = Date.now()
          
          try {
            // Simulation d'envoi d'email (remplace sendEmail)
            const result = await new Promise<{ success: boolean; error?: string }>((resolve) => {
              setTimeout(() => {
                // Simuler 90% de succès
                const isSuccess = Math.random() > 0.1
                if (isSuccess) {
                  resolve({ success: true })
                } else {
                  resolve({ success: false, error: 'Simulation d\'échec d\'envoi' })
                }
              }, 100 + Math.random() * 500) // 100-600ms de latence
            })
            
            const emailEndTime = Date.now()
            const emailTime = emailEndTime - emailStartTime
            
            times.push(emailTime)
            results.totalSent++
            
            if (result.success) {
              results.totalSuccess++
            } else {
              results.totalFailed++
              results.errors.push(`Email ${email.to}: ${result.error}`)
            }
          } catch (error) {
            results.totalFailed++
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
            results.errors.push(`Email ${email.to}: ${errorMessage}`)
          }
        })

        // Attendre que le batch soit terminé
        await Promise.allSettled(batchPromises)
        
        // Mettre à jour la progression
        setProgress(Math.round(((i + batch.length) / testEmails.length) * 100))
        
        // Pause entre les batches
        if (i + batch.length < testEmails.length) {
          await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches))
        }
      }

      // Calculer les statistiques finales
      results.averageTime = times.length > 0 
        ? times.reduce((a, b) => a + b, 0) / times.length 
        : 0
      
      results.successRate = results.totalSent > 0 
        ? (results.totalSuccess / results.totalSent) * 100 
        : 0

      setResults(results)
      
      // Notification de fin
      notifications.show({
        title: '🧪 Load Test Terminé',
        message: `${results.totalSuccess}/${results.totalSent} emails envoyés (${results.successRate.toFixed(1)}% succès)`,
        color: results.successRate > 90 ? 'green' : results.successRate > 70 ? 'yellow' : 'red',
        autoClose: 5000
      })

    } catch (error) {
      console.error('Erreur load test:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      notifications.show({
        title: '❌ Erreur Load Test',
        message: errorMessage,
        color: 'red',
        autoClose: 5000
      })
    } finally {
      setIsRunning(false)
    }
  }, [generateTestEmail])

  const runStressTest = useCallback(async () => {
    const config: LoadTestConfig = {
      batchSize: 100,
      delayBetweenBatches: 100,
      maxConcurrent: 10,
      testDuration: 60000 // 1 minute
    }

    await runLoadTest(config)
  }, [runLoadTest])

  const runVolumeTest = useCallback(async () => {
    const config: LoadTestConfig = {
      batchSize: 500,
      delayBetweenBatches: 500,
      maxConcurrent: 5,
      testDuration: 300000 // 5 minutes
    }

    await runLoadTest(config)
  }, [runLoadTest])

  const runSpikeTest = useCallback(async () => {
    // Test de pic : envoi massif rapide
    const config: LoadTestConfig = {
      batchSize: 200,
      delayBetweenBatches: 10,
      maxConcurrent: 20,
      testDuration: 30000 // 30 secondes
    }

    await runLoadTest(config)
  }, [runLoadTest])

  return {
    isRunning,
    progress,
    results,
    runLoadTest,
    runStressTest,
    runVolumeTest,
    runSpikeTest
  }
}

// Composant d'interface pour les tests de charge
export const EmailLoadTestUI = () => {
  const { isRunning, progress, results, runStressTest, runVolumeTest, runSpikeTest } = useEmailLoadTest()

  return (
    <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
      <h3 style={{ color: 'white', marginBottom: '20px' }}>🧪 Tests de Charge Email</h3>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={runStressTest}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            background: isRunning ? 'gray' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          Test de Stress (100 emails)
        </button>
        
        <button
          onClick={runVolumeTest}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            background: isRunning ? 'gray' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          Test de Volume (500 emails)
        </button>
        
        <button
          onClick={runSpikeTest}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            background: isRunning ? 'gray' : '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          Test de Pic (200 emails)
        </button>
      </div>

      {isRunning && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ color: 'white', marginBottom: '10px' }}>Progression: {progress}%</div>
          <div style={{
            width: '100%',
            height: '10px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '5px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {results && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '15px',
          borderRadius: '8px',
          color: 'white'
        }}>
          <h4 style={{ marginBottom: '15px' }}>📊 Résultats</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                {results.totalSuccess}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Succès</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                {results.totalFailed}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Échecs</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                {results.successRate.toFixed(1)}%
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Taux de succès</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                {results.averageTime.toFixed(0)}ms
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Temps moyen</div>
            </div>
          </div>
          
          {results.errors.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <h5 style={{ color: '#ef4444', marginBottom: '10px' }}>Erreurs:</h5>
              <div style={{ 
                maxHeight: '100px', 
                overflowY: 'auto', 
                fontSize: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '10px',
                borderRadius: '4px'
              }}>
                {results.errors.slice(0, 10).map((error, index) => (
                  <div key={index} style={{ marginBottom: '5px' }}>{error}</div>
                ))}
                {results.errors.length > 10 && (
                  <div style={{ fontStyle: 'italic', opacity: 0.7 }}>
                    ... et {results.errors.length - 10} autres erreurs
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
