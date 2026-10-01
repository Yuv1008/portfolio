import { ResourcePage } from '../components/ResourcePage'
import { resources } from '../lib/resources'

export default function Services() {
  return <ResourcePage definition={resources['services']!} />
}
