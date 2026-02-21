import { getAuthStatus } from './actions'
import HomeClient from './HomeClient'

export default async function Home() {
  const initialAuthenticated = await getAuthStatus()
  return <HomeClient initialAuthenticated={initialAuthenticated} />
}
