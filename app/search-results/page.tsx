import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getScreeningConfigurations, getActiveConfiguration } from '@/lib/screening-config-api'
import SearchResultsClientRefactored from './SearchResultsClientRefactored'

export default async function SearchResultsPageWrapper() {
  const supabase = await createSupabaseServerClient()
  
  // Check authentication but don't require it
  const { data: { user } } = await supabase.auth.getUser()

  try {
    // Fetch configurations
    const configurations = await getScreeningConfigurations()
    
    // Only fetch active config if user is authenticated
    const activeConfig = user ? await getActiveConfiguration(user.id) : null

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <SearchResultsClientRefactored 
          configurations={configurations}
          activeConfig={activeConfig}
          userId={user?.id || ''}
        />
      </Suspense>
    )
  } catch (error) {
    console.error('Error loading configurations:', error)
    // Return client component with empty data to handle error state
    return (
      <SearchResultsClientRefactored 
        configurations={[]}
        activeConfig={null}
        userId={user?.id || ''}
      />
    )
  }
} 