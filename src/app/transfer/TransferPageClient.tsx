'use client'

import { useSearchParams } from 'next/navigation'

export default function TransferPageClient() {
  const searchParams = useSearchParams()
  const card = searchParams.get('card')

  return <div>{card}</div>
}