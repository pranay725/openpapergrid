import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getScreeningConfigurations, getActiveConfiguration } from '@/lib/screening-config-api'
import SearchResultsClient from './search-results-client'

export default async function SearchResultsPageWrapper() {
  const supabase = await createSupabaseServerClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  try {
    // Fetch configurations and active config in parallel
    const [configurations, activeConfig] = await Promise.all([
      getScreeningConfigurations(),
      getActiveConfiguration(user.id)
    ])

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <SearchResultsClient 
          configurations={configurations}
          activeConfig={activeConfig}
          userId={user.id}
        />
      </Suspense>
    )
  } catch (error) {
    console.error('Error loading configurations:', error)
    // Return client component with empty data to handle error state
    return (
      <SearchResultsClient 
        configurations={[]}
        activeConfig={null}
        userId={user.id}
      />
    )
  }
} 