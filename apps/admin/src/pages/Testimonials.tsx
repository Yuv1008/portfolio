import { ResourcePage } from '../components/ResourcePage'
import { resources } from '../lib/resources'

export default function Testimonials() {
  return <ResourcePage definition={resources['testimonials']!} />
}
