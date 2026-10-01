import { ResourcePage } from '../components/ResourcePage'
import { resources } from '../lib/resources'

export default function Experience() {
  return <ResourcePage definition={resources['experience']!} />
}
