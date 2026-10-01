import { ResourcePage } from '../components/ResourcePage'
import { resources } from '../lib/resources'

export default function Blogs() {
  return <ResourcePage definition={resources['blogs']!} />
}
