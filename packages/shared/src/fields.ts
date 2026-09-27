/**
 * Field descriptors. The admin's ResourceForm renders inputs from these while
 * validating with the matching zod schema, so the two never drift apart: the
 * descriptor decides how a field looks, the schema decides whether it is valid.
 */
export type FieldType =
  | 'text'
  | 'textarea'
  | 'markdown'
  | 'number'
  | 'boolean'
  | 'date'
  | 'image'
  | 'tags'
  | 'select'
  | 'slug'
  | 'url'
  | 'keyvalue'

export interface FieldDescriptor<TName extends string = string> {
  name: TName
  label: string
  type: FieldType
  /** Shown under the input. */
  help?: string
  placeholder?: string
  /** Only for `select`. */
  options?: readonly { value: string; label: string }[]
  /** `slug` fields offer to derive themselves from this field. */
  derivesFrom?: string
  /** Number inputs. */
  min?: number
  max?: number
  /** Full width in the two-column form grid. */
  wide?: boolean
}

export const field = <TName extends string>(d: FieldDescriptor<TName>): FieldDescriptor<TName> => d
