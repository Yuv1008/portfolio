import bcrypt from 'bcryptjs'

const ROUNDS = 12

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, ROUNDS)

export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash)

/**
 * A hash of a throwaway value, compared against when no user matches, so a
 * request for an unknown email costs the same time as one for a known email.
 * Without it, response timing tells an attacker which addresses exist.
 */
const dummyHash = bcrypt.hashSync('timing-equalisation-placeholder', ROUNDS)

export const burnPasswordComparison = async (): Promise<void> => {
  await bcrypt.compare('timing-equalisation-placeholder', dummyHash)
}
