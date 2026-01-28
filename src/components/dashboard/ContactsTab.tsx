import { useState } from 'react'
import { Title, Text, Card, Button, Table, ActionIcon, TextInput } from '@mantine/core'
import { IconUsers, IconPlus, IconUpload, IconEdit, IconTrash, IconX } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

interface Contact {
  id: string
  email: string
  first_name: string
  last_name: string
  company?: string
  created_at: string
}

interface ContactsTabProps {
  contacts: Contact[]
  setContacts?: (contacts: Contact[]) => void
}

interface ImportedContact {
  nom_organisation: string
  adresse_email: string
}

export function ContactsTab({ contacts, setContacts }: ContactsTabProps) {
  
  const [importPreview, setImportPreview] = useState<ImportedContact[]>([])
  const [showImportModal, setShowImportModal] = useState(false)
  const [importStep, setImportStep] = useState<'preview' | 'success'>('preview')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [editForm, setEditForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company: ''
  })
  const [createForm, setCreateForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company: ''
  })
  
  const handleImportExcel = async () => {
    // Créer un input file caché
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls,.csv'
    input.style.display = 'none'
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        console.log('Fichier sélectionné:', file.name)
        
        try {
          // Importer dynamiquement XLSX pour éviter les erreurs de build
          const XLSX = await import('xlsx')
          
          // Lire le fichier
          const data = await file.arrayBuffer()
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Prendre la première feuille
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // Convertir en JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          // Mapper les données vers notre format avec plus de flexibilité
          const importedContacts: ImportedContact[] = jsonData.map((row: any) => {
            // Récupérer toutes les clés de la ligne pour débogage
            const keys = Object.keys(row);
            console.log('Colonnes trouvées:', keys);
            console.log('Données brutes:', row);
            
            // Fonction pour trouver une valeur par clé flexible
            const findValue = (possibleKeys: string[]): string => {
              for (const key of possibleKeys) {
                if (row[key] && typeof row[key] === 'string' && row[key].trim()) {
                  return row[key].trim();
                }
              }
              return '';
            };
            
            const nom_organisation = findValue([
              'Organisation', 'Nom', 'Company', 'organisation', 'société', 'societe', 
              'Société', 'Societe', 'Entreprise', 'entreprise', 'Nom Organisation',
              'Nom de l\'organisation', 'Raison Sociale', 'raison sociale', 'RS',
              'Organization', 'Organization Name', 'Business Name', 'Firm Name'
            ]);
            
            const adresse_email = findValue([
              'Email', 'email', 'Email Address', 'adresse_email', 'adresse email',
              'Mail', 'mail', 'E-mail', 'e-mail', 'Courriel', 'courriel',
              'Email Address', 'Email Adresse', 'Adresse Email', 'Contact Email'
            ]);
            
            return {
              nom_organisation,
              adresse_email
            };
          }).filter(contact => {
            const isValid = contact.adresse_email && contact.nom_organisation;
            if (!isValid) {
              console.log('Contact invalide filtré:', contact);
            }
            return isValid;
          });
          
          if (importedContacts.length === 0) {
            // Notification d'erreur moderne et informative
            notifications.show({
              id: 'import-error',
              withCloseButton: true,
              autoClose: 6000,
              title: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconX size={8} color="#ef4444" />
                  <span style={{ color: 'white', fontWeight: 600 }}>Aucun contact valide trouvé</span>
                </div>
              ),
              message: (
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Format de fichier requis :</strong>
                  </div>
                  <div style={{ 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                    borderRadius: '8px', 
                    padding: '12px',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ color: '#fbbf24', marginBottom: '4px' }}>Colonnes requises :</div>
                    <div>• Organisation (ou Société)</div>
                    <div>• Email (ou Adresse email)</div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Vérifiez que votre fichier Excel contient bien ces colonnes avec les noms exacts.
                  </div>
                </div>
              ),
              color: 'red',
              style: {
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
                minWidth: '400px',
                maxWidth: '500px'
              },
              styles: {
                closeButton: {
                  width: '16px',
                  height: '16px',
                  minHeight: '16px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  '&:hover': {
                    color: 'rgba(255, 255, 255, 0.8)',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }
                }
              },
              icon: <div style={{ width: 0 }} />
            })
            return
          }
          
          console.log('Contacts importés:', importedContacts)
          setImportPreview(importedContacts)
          setShowImportModal(true)
          
        } catch (error) {
          console.error('Erreur lors de la lecture du fichier:', error)
          
          // Notification d'erreur moderne
          notifications.show({
            id: 'file-read-error',
            withCloseButton: true,
            autoClose: 5000,
            title: (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconX size={8} color="#ef4444" />
                <span style={{ color: 'white', fontWeight: 600 }}>Erreur de lecture</span>
              </div>
            ),
            message: (
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Impossible de lire le fichier</strong>
                </div>
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.2)', 
                  borderRadius: '8px', 
                  padding: '12px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ color: '#fbbf24', marginBottom: '4px' }}>Solutions possibles :</div>
                  <div>• Vérifiez que le fichier est bien au format Excel (.xlsx, .xls)</div>
                  <div>• Assurez-vous que le fichier n'est pas corrompu</div>
                  <div>• Essayez de rouvrir et sauvegarder le fichier</div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Si le problème persiste, contactez le support technique.
                </div>
              </div>
            ),
            color: 'red',
            style: {
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
              minWidth: '400px',
              maxWidth: '500px'
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
            icon: <div style={{ width: 0 }} />
          })
        }
      }
    }
    
    // Ajouter l'input au DOM et déclencher le clic
    document.body.appendChild(input)
    input.click()
    document.body.removeChild(input)
  }
  
  const handleConfirmImport = async () => {
    try {
      console.log('Importation des contacts dans Supabase:', importPreview)
      
      // Importer dynamiquement Supabase pour éviter les erreurs
      const { supabase } = await import('../../lib/supabase')
      
      // Préparer les contacts pour l'insertion
      const contactsToInsert = importPreview.map((imported) => ({
        email: imported.adresse_email.toLowerCase().trim(),
        first_name: imported.nom_organisation.split(' ')[0] || '',
        last_name: imported.nom_organisation.split(' ').slice(1).join(' ') || imported.nom_organisation,
        company: imported.nom_organisation.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      // Insérer les contacts dans Supabase
      const { data, error } = await supabase
        .from('contacts')
        .insert(contactsToInsert)
        .select()
      
      if (error) {
        console.error('Erreur Supabase:', error)
        throw new Error(`Erreur lors de l'insertion: ${error.message}`)
      }
      
      console.log('Contacts insérés avec succès:', data)
      
      // Mettre à jour la liste locale des contacts
      if (setContacts && data) {
        const newContacts: Contact[] = data.map((contact: any) => ({
          id: contact.id,
          email: contact.email,
          first_name: contact.first_name,
          last_name: contact.last_name,
          company: contact.company,
          created_at: contact.created_at
        }))
        setContacts([...contacts, ...newContacts])
      }
      
      setImportStep('success')
      
      // Fermer le modal après 2 secondes
      setTimeout(() => {
        setShowImportModal(false)
        setImportPreview([])
        setImportStep('preview')
      }, 2000)
      
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error)
      alert(`Erreur lors de l'importation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }
  
  const handleCancelImport = () => {
    setShowImportModal(false)
    setImportPreview([])
    setImportStep('preview')
  }
  
  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact)
    setEditForm({
      email: contact.email,
      first_name: contact.first_name,
      last_name: contact.last_name,
      company: contact.company || ''
    })
    setShowEditModal(true)
  }
  
  const handleDeleteContact = (contact: Contact) => {
    setSelectedContact(contact)
    setShowDeleteModal(true)
  }
  
  const handleSaveEdit = () => {
    if (selectedContact && setContacts) {
      const updatedContacts = contacts.map(c => 
        c.id === selectedContact.id 
          ? { ...c, ...editForm }
          : c
      )
      setContacts(updatedContacts)
      setShowEditModal(false)
      setSelectedContact(null)
    }
  }
  
  const handleConfirmDelete = () => {
    if (selectedContact && setContacts) {
      const updatedContacts = contacts.filter(c => c.id !== selectedContact.id)
      setContacts(updatedContacts)
      setShowDeleteModal(false)
      setSelectedContact(null)
    }
  }
  
  const handleCreateContact = () => {
    if (setContacts) {
      const newContact: Contact = {
        id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: createForm.email,
        first_name: createForm.first_name,
        last_name: createForm.last_name,
        company: createForm.company || '',
        created_at: new Date().toISOString()
      }
      
      const updatedContacts = [...contacts, newContact]
      setContacts(updatedContacts)
      setShowCreateModal(false)
      setCreateForm({
        email: '',
        first_name: '',
        last_name: '',
        company: ''
      })
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
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)'
            }}>
              <IconUsers size={24} color="white" />
            </div>
            <div>
              <Title order={3} style={{ 
                color: 'white',
                marginBottom: '4px',
                fontSize: '1.5rem',
                fontWeight: 700,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                👥 Contacts
              </Title>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '0.95rem'
              }}>
                {contacts.length} contact(s) au total
              </Text>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              leftSection={<IconUpload size={18} />}
              onClick={handleImportExcel}
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
              📊 Importer Excel
            </Button>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => setShowCreateModal(true)}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                border: 'none',
                color: 'white',
                fontWeight: 600,
                padding: '12px 24px',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
                fontSize: '1rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(245, 158, 11, 0.6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.4)'
              }}
            >
              ➕ Ajouter un contact
            </Button>
          </div>
        </div>

        <Card style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <Table style={{
            width: '100%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontWeight: 600,
                  textAlign: 'left'
                }}>
                  Email
                </Table.Th>
                <Table.Th style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontWeight: 600,
                  textAlign: 'left'
                }}>
                  Nom
                </Table.Th>
                <Table.Th style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontWeight: 600,
                  textAlign: 'left'
                }}>
                  Entreprise
                </Table.Th>
                <Table.Th style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontWeight: 600,
                  textAlign: 'center'
                }}>
                  Actions
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {contacts.map((contact) => (
                <Table.Tr key={contact.id}>
                  <Table.Td style={{
                    padding: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    color: '#10b981',
                    fontFamily: 'monospace'
                  }}>
                    {contact.email}
                  </Table.Td>
                  <Table.Td style={{
                    padding: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    color: 'white'
                  }}>
                    {contact.first_name} {contact.last_name}
                  </Table.Td>
                  <Table.Td style={{
                    padding: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    color: 'white'
                  }}>
                    {contact.company || '-'}
                  </Table.Td>
                  <Table.Td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <ActionIcon
                        variant="light"
                        size="sm"
                        onClick={() => handleEditContact(contact)}
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
                        <IconEdit size={14} color="#3b82f6" />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        size="sm"
                        onClick={() => handleDeleteContact(contact)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          cursor: 'pointer',
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
                        <IconTrash size={14} color="#ef4444" />
                      </ActionIcon>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </div>

      {/* Modal d'importation Excel */}
      {showImportModal && (
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
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '24px',
            padding: '40px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.1)',
            position: 'relative'
          }}>
            {importStep === 'preview' ? (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '32px'
                }}>
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
                    <IconUpload size={32} color="white" />
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
                      Importation Excel
                    </Title>
                    <Text style={{ 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      fontSize: '1rem',
                      fontWeight: 500
                    }}>
                      {importPreview.length} contact(s) trouvé(s)
                    </Text>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    marginBottom: '16px'
                  }}>
                    <Table style={{
                      width: '100%',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th style={{
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontWeight: 600,
                            textAlign: 'left'
                          }}>
                            Nom de l'organisation
                          </Table.Th>
                          <Table.Th style={{
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontWeight: 600,
                            textAlign: 'left'
                          }}>
                            Adresse Email
                          </Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {importPreview.map((contact, index) => (
                          <Table.Tr key={index}>
                            <Table.Td style={{
                              padding: '12px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                              color: 'white'
                            }}>
                              {contact.nom_organisation}
                            </Table.Td>
                            <Table.Td style={{
                              padding: '12px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                              color: '#10b981',
                              fontFamily: 'monospace'
                            }}>
                              {contact.adresse_email}
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </div>

                  <Text style={{
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    marginBottom: '16px'
                  }}>
                    Ces contacts seront automatiquement disponibles pour vos campagnes email
                  </Text>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}>
                  <Button
                    onClick={handleCancelImport}
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
                    onClick={handleConfirmImport}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #34d399)',
                      border: 'none',
                      color: 'white',
                      fontWeight: 700,
                      padding: '12px 40px',
                      borderRadius: '16px',
                      boxShadow: '0 12px 32px rgba(16, 185, 129, 0.4)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    ✅ Importer {importPreview.length} contact(s)
                  </Button>
                </div>
              </>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                padding: '40px'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 12px 32px rgba(16, 185, 129, 0.4)'
                }}>
                  <IconUpload size={40} color="white" />
                </div>
                <Title order={2} style={{ 
                  color: 'white', 
                  fontSize: '2rem',
                  fontWeight: 700,
                  textAlign: 'center'
                }}>
                  Importation Réussie !
                </Title>
                <Text style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  marginBottom: '24px'
                }}>
                  {importPreview.length} contacts ont été importés avec succès
                </Text>
                <Text style={{ 
                  color: '#10b981', 
                  fontSize: '1rem',
                  textAlign: 'center',
                  fontWeight: 500
                }}>
                  Ils sont maintenant disponibles pour vos campagnes email
                </Text>
                <Button
                  onClick={() => setShowImportModal(false)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #34d399)',
                    border: 'none',
                    color: 'white',
                    fontWeight: 600,
                    padding: '16px 40px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  ✅ Terminé
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal d'édition de contact */}
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
            maxWidth: '500px',
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
                  Éditer le contact
                </Title>
                <Text style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '1rem',
                  fontWeight: 500
                }}>
                  Modifier les informations du contact
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
                  📧 Adresse Email
                </Text>
                <TextInput
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
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

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <Text style={{ 
                    color: 'white', 
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '8px'
                  }}>
                    👤 Prénom
                  </Text>
                  <TextInput
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    placeholder="Jean"
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
                    Nom
                  </Text>
                  <TextInput
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    placeholder="Dupont"
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
                  🏢 Entreprise
                </Text>
                <TextInput
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  placeholder="Nom de l'entreprise"
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
                onClick={handleSaveEdit}
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
                ✅ Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression de contact */}
      {showDeleteModal && (
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
            border: '2px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '24px',
            padding: '40px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.1)',
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
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 32px rgba(239, 68, 68, 0.4)'
              }}>
                <IconTrash size={40} color="white" />
              </div>
              
              <Title order={2} style={{ 
                color: 'white', 
                fontSize: '1.8rem',
                fontWeight: 700,
                marginBottom: '16px'
              }}>
                Supprimer le contact
              </Title>
              
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: '1rem',
                lineHeight: 1.5,
                marginBottom: '8px'
              }}>
                Êtes-vous sûr de vouloir supprimer ce contact ?
              </Text>
              
              {selectedContact && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  width: '100%'
                }}>
                  <Text style={{ 
                    color: '#ef4444', 
                    fontSize: '1rem',
                    fontWeight: 600,
                    marginBottom: '4px'
                  }}>
                    {selectedContact.email}
                  </Text>
                  <Text style={{ 
                    color: 'white', 
                    fontSize: '0.9rem'
                  }}>
                    {selectedContact.first_name} {selectedContact.last_name}
                  </Text>
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '16px',
                width: '100%'
              }}>
                <Button
                  onClick={() => setShowDeleteModal(false)}
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
                  onClick={handleConfirmDelete}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none',
                    color: 'white',
                    fontWeight: 700,
                    padding: '12px 40px',
                    borderRadius: '16px',
                    boxShadow: '0 12px 32px rgba(239, 68, 68, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  🗑️ Supprimer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création de contact */}
      {showCreateModal && (
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
            border: '2px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '24px',
            padding: '40px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.1)',
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
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 32px rgba(245, 158, 11, 0.4), 0 0 0 3px rgba(245, 158, 11, 0.1)'
              }}>
                <IconPlus size={32} color="white" />
              </div>
              <div>
                <Title order={2} style={{ 
                  color: 'white', 
                  marginBottom: '8px',
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Ajouter un contact
                </Title>
                <Text style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '1rem',
                  fontWeight: 500
                }}>
                  Créer un nouveau contact
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
                  📧 Adresse Email
                </Text>
                <TextInput
                  value={createForm.email}
                  onChange={(e: any) => setCreateForm({ ...createForm, email: e.target.value })}
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

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <Text style={{ 
                    color: 'white', 
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '8px'
                  }}>
                    👤 Prénom
                  </Text>
                  <TextInput
                    value={createForm.first_name}
                    onChange={(e: any) => setCreateForm({ ...createForm, first_name: e.target.value })}
                    placeholder="Jean"
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
                    Nom
                  </Text>
                  <TextInput
                    value={createForm.last_name}
                    onChange={(e: any) => setCreateForm({ ...createForm, last_name: e.target.value })}
                    placeholder="Dupont"
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
                  🏢 Entreprise
                </Text>
                <TextInput
                  value={createForm.company}
                  onChange={(e: any) => setCreateForm({ ...createForm, company: e.target.value })}
                  placeholder="Nom de l'entreprise"
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
                onClick={() => setShowCreateModal(false)}
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
                onClick={handleCreateContact}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 700,
                  padding: '12px 40px',
                  borderRadius: '16px',
                  boxShadow: '0 12px 32px rgba(245, 158, 11, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                ✅ Créer le contact
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
