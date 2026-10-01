import { ResourcePage } from '../components/ResourcePage'
import { resources } from '../lib/resources'

export default function Projects() {
  return <ResourcePage definition={resources['projects']!} />
}
