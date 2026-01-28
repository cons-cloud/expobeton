import { supabase } from './supabase'
import * as XLSX from 'xlsx'

// Interface pour les données d'import Excel
export interface ExcelContact {
  email: string
  first_name?: string
  last_name?: string
  full_name?: string
  job_title?: string
  phone?: string
  mobile?: string
  address?: string
  city?: string
  country?: string
  organization_name?: string
  department?: string
  linkedin_url?: string
  notes?: string
}

export interface ExcelOrganization {
  name: string
  address?: string
  phone?: string
  website?: string
  industry?: string
  size?: string
}

export interface ImportResult {
  success: boolean
  contactsImported: number
  organizationsCreated: number
  errors: string[]
  duplicates: number
}

// Service d'importation Excel
export class ExcelImportService {
  // Lire le fichier Excel
  static async readExcelFile(file: File): Promise<ExcelContact[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          // Convertir en format structuré
          const contacts = this.parseExcelData(jsonData as any[][])
          resolve(contacts)
        } catch (error) {
          reject(new Error(`Erreur lors de la lecture du fichier Excel: ${error}`))
        }
      }
      
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'))
      reader.readAsBinaryString(file)
    })
  }

  // Parser les données Excel
  private static parseExcelData(data: any[][]): ExcelContact[] {
    if (data.length < 2) {
      throw new Error('Le fichier Excel doit contenir au moins une ligne d\'en-têtes et une ligne de données')
    }

    const headers = data[0].map((h: any) => String(h).toLowerCase().trim())
    const contacts: ExcelContact[] = []

    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue

      const contact: Partial<ExcelContact> = {}
      
      // Mapper les colonnes (flexible pour différents formats)
      headers.forEach((header, index) => {
        const value = row[index] ? String(row[index]).trim() : ''
        if (!value) return

        switch (header) {
          case 'email':
          case 'e-mail':
          case 'mail':
          case 'adresse email':
            contact.email = value
            break
          case 'first_name':
          case 'prénom':
          case 'prenom':
            contact.first_name = value
            break
          case 'last_name':
          case 'nom':
          case 'nom de famille':
            contact.last_name = value
            break
          case 'full_name':
          case 'nom complet':
          case 'nom et prénom':
            contact.full_name = value
            break
          case 'job_title':
          case 'poste':
          case 'fonction':
          case 'titre':
            contact.job_title = value
            break
          case 'phone':
          case 'téléphone':
          case 'tel':
            contact.phone = value
            break
          case 'mobile':
          case 'portable':
            contact.mobile = value
            break
          case 'address':
          case 'adresse':
            contact.address = value
            break
          case 'city':
          case 'ville':
            contact.city = value
            break
          case 'country':
          case 'pays':
            contact.country = value
            break
          case 'organization':
          case 'organisation':
          case 'company':
          case 'société':
          case 'entreprise':
          case 'organization_name':
            contact.organization_name = value
            break
          case 'department':
          case 'département':
          case 'service':
            contact.department = value
            break
          case 'linkedin':
          case 'linkedin_url':
          case 'profil linkedin':
            contact.linkedin_url = value
            break
          case 'notes':
          case 'remarques':
          case 'commentaires':
            contact.notes = value
            break
        }
      })

      // Valider l'email (obligatoire)
      if (contact.email && this.isValidEmail(contact.email)) {
        contacts.push(contact as ExcelContact)
      }
    }

    return contacts
  }

  // Valider un email
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Importer les contacts dans Supabase
  static async importContacts(contacts: ExcelContact[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      contactsImported: 0,
      organizationsCreated: 0,
      errors: [],
      duplicates: 0
    }

    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) {
      throw new Error('Utilisateur non authentifié')
    }

    const importBatchId = crypto.randomUUID()

    try {
      for (const contact of contacts) {
        try {
          // 1. Gérer l'organisation si elle existe
          let organizationId = null
          if (contact.organization_name) {
            organizationId = await this.getOrCreateOrganization(contact.organization_name, userId)
            if (organizationId && !await this.organizationExists(organizationId)) {
              result.organizationsCreated++
            }
          }

          // 2. Créer ou mettre à jour le contact
          const contactData = {
            email: contact.email.toLowerCase(),
            first_name: contact.first_name || this.extractFirstName(contact.full_name),
            last_name: contact.last_name || this.extractLastName(contact.full_name),
            full_name: contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
            job_title: contact.job_title,
            phone: contact.phone,
            mobile: contact.mobile,
            address: contact.address,
            city: contact.city,
            country: contact.country,
            organization_id: organizationId,
            organization_name: contact.organization_name,
            department: contact.department,
            linkedin_url: contact.linkedin_url,
            notes: contact.notes,
            source: 'excel',
            import_batch_id: importBatchId,
            user_id: userId
          }

          // Vérifier si le contact existe déjà
          const { data: existingContact } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', contactData.email)
            .eq('user_id', userId)
            .single()

          if (existingContact) {
            result.duplicates++
            // Optionnel: mettre à jour le contact existant
            await supabase
              .from('contacts')
              .update(contactData)
              .eq('id', existingContact.id)
          } else {
            // Créer le nouveau contact
            await supabase
              .from('contacts')
              .insert(contactData)
            result.contactsImported++
          }

        } catch (error) {
          result.errors.push(`Erreur avec ${contact.email}: ${error}`)
        }
      }

      if (result.errors.length > 0 && result.errors.length === contacts.length) {
        result.success = false
      }

    } catch (error) {
      result.success = false
      result.errors.push(`Erreur générale: ${error}`)
    }

    return result
  }

  // Obtenir ou créer une organisation
  private static async getOrCreateOrganization(orgName: string, userId: string): Promise<string | null> {
    try {
      // Vérifier si l'organisation existe
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', orgName)
        .eq('user_id', userId)
        .single()

      if (existingOrg) {
        return existingOrg.id
      }

      // Créer la nouvelle organisation
      const { data: newOrg } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          user_id: userId
        })
        .select('id')
        .single()

      return newOrg?.id || null

    } catch (error) {
      console.error('Erreur lors de la gestion de l\'organisation:', error)
      return null
    }
  }

  // Vérifier si une organisation existe
  private static async organizationExists(orgId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', orgId)
        .single()
      return !!data
    } catch {
      return false
    }
  }

  // Extraire le prénom du nom complet
  private static extractFirstName(fullName?: string): string | undefined {
    if (!fullName) return undefined
    const parts = fullName.trim().split(' ')
    return parts[0]
  }

  // Extraire le nom de famille du nom complet
  private static extractLastName(fullName?: string): string | undefined {
    if (!fullName) return undefined
    const parts = fullName.trim().split(' ')
    return parts.length > 1 ? parts.slice(1).join(' ') : undefined
  }

  // Obtenir les statistiques d'importation
  static async getImportStats(batchId?: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) throw new Error('Utilisateur non authentifié')

    let query = supabase
      .from('contacts')
      .select('source, created_at')
      .eq('user_id', userId)

    if (batchId) {
      query = query.eq('import_batch_id', batchId)
    }

    const { data } = await query

    return {
      total: data?.length || 0,
      fromExcel: data?.filter(c => c.source === 'excel').length || 0,
      manual: data?.filter(c => c.source === 'manual').length || 0,
      recentImports: data?.filter(c => 
        c.source === 'excel' && 
        new Date(c.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0
    }
  }
}

export default ExcelImportService
