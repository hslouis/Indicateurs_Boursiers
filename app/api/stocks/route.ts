import { NextResponse } from 'next/server'
import { getAllQuotes } from '@/lib/market'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const data = await getAllQuotes()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Échec de récupération des données de marché' },
      { status: 500 },
    )
  }
}
