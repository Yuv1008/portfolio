import { ResourcePage } from '../components/ResourcePage'
import { resources } from '../lib/resources'

export default function Skills() {
  return <ResourcePage definition={resources['skills']!} />
}
