import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseClient } from '@/lib/supabase'
import type { 
  ScreeningConfiguration, 
  CustomField, 
  ConfigVisibility,
  Database
} from '@/lib/database.types'

type ScreeningConfigRow = Database['public']['Tables']['screening_configurations']['Row']
type ScreeningConfigInsert = Database['public']['Tables']['screening_configurations']['Insert']
type ScreeningConfigUpdate = Database['public']['Tables']['screening_configurations']['Update']

// Convert database row to ScreeningConfiguration type
function rowToScreeningConfig(row: ScreeningConfigRow): ScreeningConfiguration {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    user_id: row.user_id,
    fields: (row.fields as any) as CustomField[],
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

// Server-side functions (for use in Server Components and Route Handlers)
export async function getScreeningConfigurations() {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('screening_configurations')
    .select('*')
    .order('visibility', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  
  return data?.map(rowToScreeningConfig) || []
}

export async function getActiveConfiguration(userId: string) {
  const supabase = await createSupabaseServerClient()
  
  // First get the active configuration ID
  const { data: activeConfig, error: activeError } = await supabase
    .from('user_active_configuration')
    .select('configuration_id')
    .eq('user_id', userId)
    .single()

  if (activeError && activeError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw activeError
  }

  if (!activeConfig) {
    // No active config set, get the default "Basic Screening" config
    const { data: defaultConfig, error: defaultError } = await supabase
      .from('screening_configurations')
      .select('*')
      .eq('visibility', 'default')
      .eq('name', 'Basic Screening')
      .single()

    if (defaultError) throw defaultError
    return defaultConfig ? rowToScreeningConfig(defaultConfig) : null
  }

  // Get the full configuration
  const { data: config, error: configError } = await supabase
    .from('screening_configurations')
    .select('*')
    .eq('id', activeConfig.configuration_id)
    .single()

  if (configError) throw configError
  return config ? rowToScreeningConfig(config) : null
}

// Client-side functions (for use in Client Components)
export async function setActiveConfiguration(configurationId: string) {
  const supabase = createSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('user_active_configuration')
    .upsert({
      user_id: user.id,
      configuration_id: configurationId,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })

  if (error) throw error
}

export async function createConfiguration(
  name: string,
  description: string,
  fields: CustomField[],
  visibility: ConfigVisibility = 'private'
) {
  const supabase = createSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const newConfig: ScreeningConfigInsert = {
    name,
    description,
    fields: fields as any, // Cast to any to satisfy JSONB type
    visibility,
    user_id: user.id,
    is_active: true
  }

  const { data, error } = await supabase
    .from('screening_configurations')
    .insert(newConfig)
    .select()
    .single()

  if (error) throw error
  return rowToScreeningConfig(data)
}

export async function updateConfiguration(
  id: string,
  updates: {
    name?: string
    description?: string
    fields?: CustomField[]
    visibility?: ConfigVisibility
    is_active?: boolean
  }
) {
  const supabase = createSupabaseClient()
  
  const updateData: ScreeningConfigUpdate = {
    ...updates,
    fields: updates.fields as any, // Cast to any to satisfy JSONB type
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('screening_configurations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return rowToScreeningConfig(data)
}

export async function deleteConfiguration(id: string) {
  const supabase = createSupabaseClient()
  
  const { error } = await supabase
    .from('screening_configurations')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get configurations accessible to the current user
export async function getAccessibleConfigurations() {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('screening_configurations')
    .select('*')
    .order('visibility', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  
  return data?.map(rowToScreeningConfig) || []
}

// Duplicate a configuration
export async function duplicateConfiguration(
  sourceId: string,
  newName: string,
  visibility: ConfigVisibility = 'private'
) {
  const supabase = createSupabaseClient()
  
  // Get the source configuration
  const { data: source, error: sourceError } = await supabase
    .from('screening_configurations')
    .select('*')
    .eq('id', sourceId)
    .single()

  if (sourceError) throw sourceError
  if (!source) throw new Error('Source configuration not found')

  // Create the duplicate
  return createConfiguration(
    newName,
    source.description || '',
    (source.fields as any) as CustomField[],
    visibility
  )
} 